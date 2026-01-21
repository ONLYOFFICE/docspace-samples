# HR Folder + NDA Generation + Group Assignment

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
import json

app = Flask(__name__)

# Generate HMAC-SHA256 signature
def get_secret_hash(secret_key, body):
    return "sha256=" + hmac.new(secret_key.encode(), body.encode(), hashlib.sha256).hexdigest().upper()

@app.route("/webhook", methods=["POST"])
def webhook():
    sig = request.headers.get("x-docspace-signature-256")
    if not sig:
        app.logger.error("Unsigned request")
        abort(401)

    secret_key = os.environ.get("WEBHOOK_SECRET_KEY")
    body = json.dumps(request.json)
    hash_ = get_secret_hash(secret_key, body)

    if sig != hash_:
        app.logger.error("Invalid signature")
        abort(401)

    event = request.json.get("event", {}).get("trigger")
    if event != "user.created":
        return "", 200

    user = request.json.get("payload", {})
    full_name = f"{user.get('firstName')} {user.get('lastName')}"
    hr_folder_id = os.environ.get("HR_FOLDER_ID")

    try:
        # Step 1: Create personal HR folder
        folder_response = requests.post(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/folder/{hr_folder_id}",
            json={
                "title": full_name,
                "parentId": hr_folder_id
            },
            headers={
                "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                "Content-Type": "application/json"
            }
        ).json()

        personal_folder_id = folder_response.get("response", {}).get("id")
        app.logger.info(f'HR folder "{full_name}" created')

        # Step 2: Copy NDA template to the user's folder
        nda_file_title = f"NDA_{user.get('firstName')}_{user.get('lastName')}.docx"

        requests.post(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/copy",
            json={
                "fileId": os.environ.get("NDA_TEMPLATE_FILE_ID"),
                "folderId": personal_folder_id,
                "title": nda_file_title
            },
            headers={
                "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                "Content-Type": "application/json"
            }
        )

        app.logger.info(f"NDA file created: {nda_file_title}")

        # Step 3: Add user to the "New Hires" group
        requests.post(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/group/{os.environ.get('NEW_HIRES_GROUP_ID')}/add",
            json={
                "userIds": [user.get("id")]
            },
            headers={
                "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                "Content-Type": "application/json"
            }
        )

        app.logger.info(f"User {full_name} added to New Hires group")

        return "", 200

    except Exception as err:
        app.logger.error(f"Error processing user.created event: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
