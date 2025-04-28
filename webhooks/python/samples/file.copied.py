# Block confidential file copies

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os

app = Flask(__name__)

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
    file_id = payload.get("id")
    title = payload.get("title")
    room_id = payload.get("rootId")
    created_by = payload.get("createBy")

    # Handle file.copied event
    if trigger == "file.copied":
        app.logger.info(f"File copy detected: \"{title}\" in room #{room_id}")

        lower_title = title.lower() if title else ""

        if "confidential" in lower_title:
            app.logger.info(f"Blocked file copy attempt: \"{title}\" (ID: {file_id})")

            try:
                # Delete the copied file
                delete_response = requests.delete(
                    f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{file_id}",
                    headers={
                        "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                        "Content-Type": "application/json"
                    }
                )
                delete_response.raise_for_status()

                app.logger.info(f"Copied file \"{title}\" deleted successfully")

                # Notify admin about the blocked copy
                notify_response = requests.post(
                    os.environ.get("NOTIFY_WEBHOOK_URL"),
                    json={
                        "to": os.environ.get("ADMIN_EMAIL"),
                        "subject": "Blocked confidential file copy",
                        "message": f"A user with ID {created_by} attempted to copy a confidential file \"{title}\" in room #{room_id}. The copy has been deleted."
                    },
                    headers={
                        "Content-Type": "application/json"
                    }
                )
                notify_response.raise_for_status()

                app.logger.info("Admin notified about blocked copy")

                return "", 200

            except requests.exceptions.RequestException as err:
                app.logger.error(f"Error while blocking confidential file copy: {err}")
                return "", 500

        # If not a confidential file, allow copy silently
        return "", 200

    return "", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
