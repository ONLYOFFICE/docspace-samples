# Room Deletion - Notify Participants, Admin, and Save Access Log

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
import json
import tempfile
from datetime import datetime

app = Flask(__name__)

SENSITIVE_ROOM_KEYWORDS = ["hr", "finance", "legal", "clients", "external"]

# Generate HMAC-SHA256 signature
def get_secret_hash(secret, payload):
    return "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()

@app.route("/webhook", methods=["POST"])
def webhook():
    signature = request.headers.get("x-docspace-signature-256")
    computed_signature = get_secret_hash(
        os.environ.get("WEBHOOK_SECRET_KEY"),
        request.get_data()
    )

    if signature != computed_signature:
        app.logger.warning("Invalid signature")
        abort(401)

    event = request.json.get("event", {})
    payload = request.json.get("payload", {})

    trigger = event.get("trigger")
    if trigger != "room.deleted":
        return "", 200

    room_title = payload.get("title")
    room_id = payload.get("rootId")
    created_by = payload.get("createBy")
    lower_title = room_title.lower() if room_title else ""
    timestamp = datetime.utcnow().isoformat()

    app.logger.info(f'Room deleted: "{room_title}" ({room_id})')

    try:
        # Step 1: Get room participants and access types
        share_res = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/rooms/{room_id}/share",
            headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
        ).json()

        users = share_res.get("access", [])

        # Step 2: Notify all participants
        for user in users:
            email = user.get("sharedTo", {}).get("email")
            if not email:
                continue

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": email,
                    "subject": "Room deleted",
                    "message": f'The room "{room_title}" has been deleted. If this is unexpected, please contact your administrator.'
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info(f"User notified: {email}")

        # Step 3: Save deletion access log
        access_log = [
            {
                "email": user.get("sharedTo", {}).get("email", "[no email]"),
                "accessLevel": user.get("access", "[unknown]")
            }
            for user in users
        ]

        log_data = {
            "roomId": room_id,
            "roomTitle": room_title,
            "deletedAt": timestamp,
            "accessBeforeDeletion": access_log
        }

        with tempfile.NamedTemporaryFile(delete=False, suffix=".json", mode="w") as tmpfile:
            json.dump(log_data, tmpfile, indent=2)
            temp_log_path = tmpfile.name

        with open(temp_log_path, "rb") as f:
            files_payload = {"file": f}
            upload_res = requests.post(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/files/folder/{os.environ.get('DELETION_LOG_FOLDER_ID')}/upload",
                files=files_payload,
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            ).json()

        os.unlink(temp_log_path)

        uploaded = upload_res.get("response", [{}])[0]
        log_url = f"{os.environ.get('PORTAL_URL')}/file/{uploaded.get('id')}"

        app.logger.info("Access log uploaded")

        # Step 4: If sensitive room - notify admin
        is_sensitive = any(keyword in lower_title for keyword in SENSITIVE_ROOM_KEYWORDS)
        if is_sensitive:
            creator_info = requests.get(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/people/{created_by}",
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            ).json()

            creator_name = f"{creator_info.get('firstName', '')} {creator_info.get('lastName', '')}".strip()
            creator_email = creator_info.get("email", "[unknown]")

            admin_message = (
                f"Sensitive room \"{room_title}\" has been deleted.\n\n"
                f"Deleted by: {creator_name} ({creator_email})\n"
                f"Room ID: {room_id}\n"
                f"Date: {timestamp}\n\n"
                f"Access log before deletion:\n{log_url}"
            )

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Sensitive Room Deleted",
                    "message": admin_message
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info("Admin notified about sensitive room deletion")

        return "", 200

    except Exception as err:
        app.logger.error(f"Error handling room.deleted: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
