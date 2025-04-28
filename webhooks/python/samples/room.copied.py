# Room Copy - Notify Members and Admin if Sensitive

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
from datetime import datetime

app = Flask(__name__)

# Keywords for sensitive room names
SENSITIVE_KEYWORDS = ["hr", "finance", "legal", "clients", "external"]

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
    if trigger != "room.copied":
        return "", 200

    room_title = payload.get("title")
    room_id = payload.get("rootId")
    created_by = payload.get("createBy")
    lower_title = room_title.lower() if room_title else ""
    timestamp = datetime.utcnow().isoformat()

    app.logger.info(f'Room copied: "{room_title}"')

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
                    "subject": "Room copied",
                    "message": f'The room "{room_title}" has been copied. Please check the new room if necessary.'
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info(f"User notified: {email}")

        # Step 2: If sensitive room - notify admin
        is_sensitive = any(keyword in lower_title for keyword in SENSITIVE_KEYWORDS)
        if is_sensitive:
            creator_info = requests.get(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/people/{created_by}",
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            ).json()

            creator_name = f"{creator_info.get('firstName', '')} {creator_info.get('lastName', '')}".strip()
            creator_email = creator_info.get("email", "[unknown]")

            admin_message = (
                f"A sensitive room has been copied.\n\n"
                f"Room Title: \"{room_title}\"\n"
                f"Room ID: {room_id}\n"
                f"Copied By: {creator_name} ({creator_email})\n"
                f"Date: {timestamp}"
            )

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Sensitive Room Copied",
                    "message": admin_message
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info("Admin notified about sensitive room copy")

        return "", 200

    except Exception as err:
        app.logger.error(f"Error handling room.copy: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
