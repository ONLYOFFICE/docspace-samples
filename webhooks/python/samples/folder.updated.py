# Admin notification for critical folders

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
from datetime import datetime

app = Flask(__name__)

SENSITIVE_FOLDER_KEYWORDS = ["contracts", "finance", "hr", "legal", "clients"]

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
    if trigger != "folder.updated":
        return "", 200

    folder_id = payload.get("id")
    new_title = payload.get("title")
    room_id = payload.get("rootId")
    created_by = payload.get("createBy")
    previous_title = payload.get("previousTitle", "[unknown]")

    lower_new_title = new_title.lower() if new_title else ""
    timestamp = datetime.utcnow().isoformat()

    app.logger.info(f'Folder renamed: "{previous_title}" → "{new_title}" (Room ID: {room_id})')

    try:
        # Step 1: Notify room participants
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
                    "subject": "Folder renamed",
                    "message": f'The folder has been renamed to "{new_title}". Please check the updated structure.'
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info(f"User notified: {email}")

        # Step 2: If sensitive folder - notify admin
        is_sensitive = any(keyword in lower_new_title for keyword in SENSITIVE_FOLDER_KEYWORDS)

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
                f"Sensitive folder renamed.\n\n"
                f"Previous Folder Title: \"{previous_title}\"\n"
                f"New Folder Title: \"{new_title}\"\n\n"
                f"Room: \"{room_title}\" (ID: {room_id})\n"
                f"Renamed By: {creator_name} ({creator_email})\n"
                f"Date: {timestamp}"
            )

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Sensitive Folder Renamed",
                    "message": admin_message
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info("Admin notified about sensitive folder rename")

        return "", 200

    except Exception as err:
        app.logger.error(f"Error handling folder.updated: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
