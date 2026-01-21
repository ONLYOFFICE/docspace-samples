# Rename Copied Folder

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
from datetime import datetime

app = Flask(__name__)

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
    folder_id = payload.get("id")
    folder_title = payload.get("title")
    created_by = payload.get("createBy")

    # Handle folder copied event
    if trigger == "folder.copied":
        app.logger.info(f'Folder "{folder_title}" was copied (ID: {folder_id})')

        try:
            # Generate new folder name with date
            today = datetime.utcnow().strftime("%Y-%m-%d")  # Format: YYYY-MM-DD
            new_title = f"{folder_title}_COPY_{today}"

            # Rename the folder via API
            requests.put(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/folders/{folder_id}/rename",
                json={"title": new_title},
                headers={
                    "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                    "Content-Type": "application/json"
                }
            )

            app.logger.info(f'Folder renamed to "{new_title}"')

            # Optionally: notify the user who copied the folder
            user_info = requests.get(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/people/{created_by}",
                headers={
                    "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                    "Content-Type": "application/json"
                }
            ).json()

            email = user_info.get("email")
            if email:
                requests.post(
                    os.environ.get("NOTIFY_WEBHOOK_URL"),
                    json={
                        "to": email,
                        "subject": "Folder copied",
                        "message": f'You copied the folder "{folder_title}". It has been renamed to "{new_title}".'
                    },
                    headers={"Content-Type": "application/json"}
                )

                app.logger.info(f"Notification sent to {email}")

            return "", 200

        except Exception as err:
            app.logger.error(f"Error handling folder.copied: {err}")
            return "", 500

    return "", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
