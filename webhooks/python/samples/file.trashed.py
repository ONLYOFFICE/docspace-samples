# Sensitive file deletion: admin notification and event logging

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
import json
import tempfile
from datetime import datetime

app = Flask(__name__)

SENSITIVE_KEYWORDS = ["contract", "finance", "nda", "invoice", "confidential"]

# Generate HMAC-SHA256 signature
def get_secret_hash(secret, payload):
    return "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()

@app.route("/webhook", methods=["POST"])
def webhook():
    signature = request.headers.get("x-docspace-signature-256")
    computed_signature = get_secret_hash(os.environ.get("WEBHOOK_SECRET_KEY"), request.get_data())

    if signature != computed_signature:
        app.logger.warning("Invalid signature")
        abort(401)

    event = request.json.get("event", {})
    payload = request.json.get("payload", {})

    trigger = event.get("trigger")
    if trigger != "file.trashed":
        return "", 200

    file_id = payload.get("id")
    title = payload.get("title")
    room_id = payload.get("rootId")
    created_by = payload.get("createBy")
    lower_title = title.lower()
    timestamp = datetime.utcnow().isoformat()

    app.logger.info(f'File trashed: "{title}" (Room ID: {room_id})')

    try:
        # Step 1: Get room participants
        share_response = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/rooms/{room_id}/share",
            headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
        )
        share_response.raise_for_status()
        users = share_response.json().get("access", [])

        # Step 2: Notify all users
        for user in users:
            email = user.get("sharedTo", {}).get("email")
            if not email:
                continue

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": email,
                    "subject": "File deleted",
                    "message": f'A file "{title}" has been deleted from Room #{room_id}.'
                },
                headers={"Content-Type": "application/json"}
            )
            app.logger.info(f"User notified: {email}")

        # Step 3: Save deletion log
        log_data = {
            "fileId": file_id,
            "title": title,
            "trashedAt": timestamp,
            "roomId": room_id
        }

        with tempfile.NamedTemporaryFile(delete=False, suffix=".json", mode="w") as tmpfile:
            json.dump(log_data, tmpfile, indent=2)
            tmpfile_path = tmpfile.name

        with open(tmpfile_path, "rb") as f:
            upload_response = requests.post(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/files/folder/{os.environ.get('TRASH_LOG_FOLDER_ID')}/upload",
                files={"file": f},
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            )
            upload_response.raise_for_status()

        os.unlink(tmpfile_path)

        uploaded = upload_response.json().get("response", [{}])[0]
        log_url = f"{os.environ.get('PORTAL_URL')}/file/{uploaded.get('id')}"

        app.logger.info("Deletion log uploaded")

        # Step 4: If sensitive - notify admin
        is_sensitive = any(keyword in lower_title for keyword in SENSITIVE_KEYWORDS)

        if is_sensitive:
            creator_info = requests.get(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/people/{created_by}",
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            ).json()

            creator_name = f"{creator_info.get('firstName', '')} {creator_info.get('lastName', '')}".strip()
            creator_email = creator_info.get("email", "[unknown]")

            admin_message = (
                f"Sensitive file deleted.\n\n"
                f"File Title: \"{title}\"\n"
                f"File ID: {file_id}\n"
                f"Room ID: {room_id}\n"
                f"Deleted By: {creator_name} ({creator_email})\n"
                f"Date: {timestamp}\n\n"
                f"Access Deletion Log:\n{log_url}"
            )

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Sensitive File Deleted",
                    "message": admin_message
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info("Admin notified about sensitive file deletion")

        return "", 200

    except Exception as err:
        app.logger.error(f"Error handling file.trashed: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
