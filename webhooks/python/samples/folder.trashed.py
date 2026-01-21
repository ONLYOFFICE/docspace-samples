# Sensitive folder trashed: admin notification and participant alerts

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
from datetime import datetime

app = Flask(__name__)

SENSITIVE_FOLDER_KEYWORDS = ["hr", "finance", "legal", "clients", "contracts"]

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
    if trigger != "folder.trashed":
        return "", 200

    folder_title = payload.get("title")
    room_id = payload.get("rootId")
    folder_id = payload.get("id")
    created_by = payload.get("createBy")

    lower_title = folder_title.lower() if folder_title else ""
    timestamp = datetime.utcnow().isoformat()

    app.logger.info(f'Folder trashed: "{folder_title}" (Room ID: {room_id})')

    try:
        # Step 1: Notify all room participants
        room_share = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/rooms/{room_id}/share",
            headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
        ).json()

        users = room_share.get("access", [])

        for user in users:
            email = user.get("sharedTo", {}).get("email")
            if not email:
                continue

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": email,
                    "subject": "Folder deleted",
                    "message": f'The folder "{folder_title}" has been moved to the trash from Room #{room_id}. If this was done by mistake, it can be restored.'
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info(f"User notified: {email}")

        # Step 2: If sensitive folder - notify admin
        is_sensitive = any(keyword in lower_title for keyword in SENSITIVE_FOLDER_KEYWORDS)

        if is_sensitive:
            creator_info = requests.get(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/people/{created_by}",
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            ).json()

            room_info = requests.get(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/files/rooms/{room_id}",
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            ).json()

            creator_name = f"{creator_info.get('firstName', '')} {creator_info.get('lastName', '')}".strip()
            creator_email = creator_info.get("email", "[unknown]")
            room_title = room_info.get("response", {}).get("title", "[Unknown Room]")

            admin_message = (
                f"Sensitive folder deleted.\n\n"
                f"Folder Title: \"{folder_title}\"\n"
                f"Folder ID: {folder_id}\n"
                f"Room Title: \"{room_title}\"\n"
                f"Room ID: {room_id}\n"
                f"Deleted By: {creator_name} ({creator_email})\n"
                f"Date: {timestamp}"
            )

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Sensitive Folder Deleted",
                    "message": admin_message
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info("Admin notified about sensitive folder deletion")

        return "", 200

    except Exception as err:
        app.logger.error(f"Error handling folder.trashed: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
