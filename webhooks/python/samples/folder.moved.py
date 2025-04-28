# Sensitive Folder Move Alert + Owner Notification

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os

app = Flask(__name__)

# Keywords to flag sensitive folders
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
    if trigger != "folder.moved":
        return "", 200

    folder_title = payload.get("title")
    root_id = payload.get("rootId")
    created_by = payload.get("createBy")
    folder_id = payload.get("id")

    app.logger.info(f'Folder moved: "{folder_title}"')

    try:
        # Step 1: Get user info
        user_info = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/people/{created_by}",
            headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
        ).json()

        user_email = user_info.get("email")
        user_name = f"{user_info.get('firstName', '')} {user_info.get('lastName', '')}".strip()

        # Step 2: Notify user
        if user_email:
            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": user_email,
                    "subject": "Folder moved",
                    "message": f'The folder "{folder_title}" has been moved to a new location in the room structure.'
                },
                headers={"Content-Type": "application/json"}
            )
            app.logger.info(f"User notified: {user_email}")

        # Step 3: Get folder details (for tags)
        folder_meta = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{folder_id}",
            headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
        ).json()

        folder_tags = folder_meta.get("response", {}).get("tags", [])
        lower_title = folder_title.lower() if folder_title else ""
        combined = " ".join([lower_title] + [tag.lower() for tag in folder_tags])

        is_sensitive = any(keyword in combined for keyword in SENSITIVE_KEYWORDS)

        # Step 4: If sensitive - notify admin
        if is_sensitive:
            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Sensitive folder moved",
                    "message": f'User "{user_name}" moved a sensitive folder: "{folder_title}"\n\nFolder ID: {folder_id}\nRoom ID: {root_id}'
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info("Admin notified about sensitive move")

        return "", 200

    except Exception as err:
        app.logger.error(f"Error handling folder.moved: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
