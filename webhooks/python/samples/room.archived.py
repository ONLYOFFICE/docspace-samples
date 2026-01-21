# Archived room: full file export to Box storage

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
import json
import tempfile
import shutil
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
    room_title = payload.get("title")
    root_id = payload.get("rootId")

    if trigger != "room.archived":
        return "", 200

    try:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        box_folder_name = f"ARCHIVE_{room_title}_{today}"

        # Step 1: Create a folder in Box
        create_folder_res = requests.post(
            "https://api.box.com/2.0/folders",
            json={
                "name": box_folder_name,
                "parent": {"id": "0"}
            },
            headers={
                "Authorization": f"Bearer {os.environ.get('BOX_ACCESS_TOKEN')}",
                "Content-Type": "application/json"
            }
        ).json()

        box_folder_id = create_folder_res.get("id")
        app.logger.info(f"Box folder created: {box_folder_name} (ID: {box_folder_id})")

        # Step 2: Get list of files in the archived room
        files_res = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{root_id}/list",
            headers={
                "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                "Content-Type": "application/json"
            }
        ).json()

        files = files_res.get("response", [])

        for file in files:
            if file.get("folder"):
                continue  # skip folders

            file_id = file.get("id")
            file_name = file.get("title")

            # Step 3: Get download link for the file
            download_link_res = requests.get(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{file_id}/download",
                headers={
                    "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                    "Content-Type": "application/json"
                }
            ).json()

            download_url = download_link_res.get("response", {}).get("downloadUrl")
            if not download_url:
                app.logger.warning(f"Skipping file {file_name}, no download URL")
                continue

            # Step 4: Download file temporarily
            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                file_data = requests.get(download_url, stream=True)
                shutil.copyfileobj(file_data.raw, tmp_file)
                temp_file_path = tmp_file.name

            # Step 5: Upload file to Box
            with open(temp_file_path, "rb") as f:
                attributes = json.dumps({
                    "name": file_name,
                    "parent": {"id": box_folder_id}
                })
                files_payload = {
                    "attributes": (None, attributes),
                    "file": (file_name, f)
                }
                upload_res = requests.post(
                    "https://upload.box.com/api/2.0/files/content",
                    files=files_payload,
                    headers={"Authorization": f"Bearer {os.environ.get('BOX_ACCESS_TOKEN')}"}
                )

            os.unlink(temp_file_path)
            app.logger.info(f'Uploaded "{file_name}" to Box folder {box_folder_name}')

        return "", 200

    except Exception as err:
        app.logger.error(f"Error archiving room to Box: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
