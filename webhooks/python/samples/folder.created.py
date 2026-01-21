# Create Subfolders for "HR Onboarding"

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
    title = payload.get("title")

    # Triggered when a folder named "HR Onboarding" is created
    if trigger == "folder.created" and title == "HR Onboarding":
        app.logger.info("HR Onboarding folder created, creating subfolders...")

        subfolders = ["Documents", "Passport Photos", "Signed Forms"]

        try:
            for subfolder_name in subfolders:
                requests.post(
                    f"{os.environ.get('PORTAL_URL')}/api/2.0/files/folder/{folder_id}",
                    json={"title": subfolder_name},
                    headers={
                        "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                        "Content-Type": "application/json"
                    }
                )

                app.logger.info(f"Subfolder created: {subfolder_name}")

            return "", 200

        except Exception as err:
            app.logger.error(f"Error while creating HR subfolders: {err}")
            return "", 500

    return "", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
