# Sensitive content alert and forbidden file protection

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
from datetime import datetime

app = Flask(__name__)

SENSITIVE_KEYWORDS = ["contract", "nda", "invoice"]
FORBIDDEN_EXTENSIONS = [".exe", ".bat", ".sh", ".zip"]

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

    trigger = request.json.get("event", {}).get("trigger")
    if trigger != "file.uploaded":
        return "", 200

    payload = request.json.get("payload", {})
    file_id = payload.get("id")
    title = payload.get("title")
    room_id = payload.get("rootId")
    created_by = payload.get("createBy")

    lower_title = title.lower() if title else ""
    timestamp = datetime.utcnow().isoformat()

    app.logger.info(f'New file uploaded: "{title}" (Room ID: {room_id})')

    try:
        # Step 1: Forbidden file type check
        is_forbidden = any(lower_title.endswith(ext) for ext in FORBIDDEN_EXTENSIONS)

        if is_forbidden:
            requests.delete(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/files/file/{file_id}",
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            )

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Forbidden file deleted",
                    "message": f'A forbidden file "{title}" was uploaded and has been automatically deleted.\n\nRoom ID: {room_id}\nTime: {timestamp}'
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info(f'Forbidden file "{title}" deleted and admin notified.')
            return "", 200

        # Step 2: Sensitive file name check
        is_sensitive = any(keyword in lower_title for keyword in SENSITIVE_KEYWORDS)

        if is_sensitive:
            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Sensitive file uploaded",
                    "message": f'A sensitive file "{title}" has been uploaded.\n\nRoom ID: {room_id}\nTime: {timestamp}'
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info(f'Sensitive file "{title}" detected and admin notified.')

        return "", 200

    except Exception as err:
        app.logger.error(f"Error handling file upload: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
