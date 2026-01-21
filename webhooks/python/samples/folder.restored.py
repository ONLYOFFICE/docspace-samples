# Sensitive Folder Restore Alert

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
from datetime import datetime

app = Flask(__name__)

SENSITIVE_KEYWORDS = ["contract", "finance", "nda"]

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
    if trigger != "folder.restored":
        return "", 200

    folder_title = payload.get("title")
    root_id = payload.get("rootId")
    folder_id = payload.get("id")
    lower_title = folder_title.lower() if folder_title else ""

    app.logger.info(f'Folder restored: "{folder_title}"')

    try:
        # Step 1: Notify all users in the room
        room_share = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/rooms/{root_id}/share",
            headers={
                "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                "Content-Type": "application/json"
            }
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
                    "subject": "Folder restored",
                    "message": f'The folder "{folder_title}" has been restored and is now visible again in Room #{root_id}.'
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info(f"User notified: {email}")

        # Step 2: If sensitive, notify admin
        is_sensitive = any(keyword in lower_title for keyword in SENSITIVE_KEYWORDS)

        if is_sensitive:
            timestamp = datetime.utcnow().isoformat()

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Sensitive folder restored",
                    "message": f'Sensitive folder "{folder_title}" (ID: {folder_id}) was restored in Room #{root_id} on {timestamp}.'
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info("Admin notified about sensitive folder restoration")

        return "", 200

    except Exception as err:
        app.logger.error(f"Error during folder.restore handling: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
