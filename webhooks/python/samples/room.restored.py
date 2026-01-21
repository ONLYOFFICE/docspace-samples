# Room Restore - Notify Members, Admin, Audit Access

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
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
    if trigger != "room.restored":
        return "", 200

    room_title = payload.get("title")
    room_id = payload.get("rootId")
    created_by = payload.get("createBy")
    lower_title = room_title.lower() if room_title else ""
    timestamp = datetime.utcnow().isoformat()

    app.logger.info(f'Room restored: "{room_title}" ({room_id})')

    try:
        # Step 1: Notify all room members
        share_res = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/rooms/{room_id}/share",
            headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
        ).json()

        users = share_res.get("access", [])

        for user in users:
            email = user.get("sharedTo", {}).get("email")
            if not email:
                continue

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": email,
                    "subject": "Room restored",
                    "message": f'The room "{room_title}" has been restored and is now available.'
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info(f"User notified: {email}")

        # Step 2: If sensitive room - notify admin with access list
        is_sensitive = any(keyword in lower_title for keyword in SENSITIVE_ROOM_KEYWORDS)
        if is_sensitive:
            restorer_info = requests.get(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/people/{created_by}",
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            ).json()

            restorer_name = f"{restorer_info.get('firstName', '')} {restorer_info.get('lastName', '')}".strip()
            restorer_email = restorer_info.get("email", "[unknown]")

            access_list = "\n".join([
                f"- {user.get('sharedTo', {}).get('email', '[no email]')}"
                + (" (external)" if not user.get('sharedTo', {}).get('email', '').endswith("@onlyoffice.com") else "")
                for user in users
            ])

            message = (
                f"Sensitive room \"{room_title}\" has been restored.\n\n"
                f"Restored by: {restorer_name} ({restorer_email})\n"
                f"Room ID: {room_id}\n"
                f"Date: {timestamp}\n\n"
                f"Room Access List:\n{access_list}"
            )

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Sensitive room restored",
                    "message": message
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info("Admin notified with access list")

        return "", 200

    except Exception as err:
        app.logger.error(f"Error in room.restored handler: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
