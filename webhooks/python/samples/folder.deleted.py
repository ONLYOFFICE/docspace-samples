# Archive + Notify + Recovery for Deleted Folders

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
import tempfile
import shutil
from datetime import datetime

app = Flask(__name__)

ARCHIVE_TAGS = ["contract", "invoice", "legal"]
SENSITIVE_PATH_KEYWORDS = ["HR", "Finance", "Clients"]

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
    folder_title = payload.get("title")
    folder_id = payload.get("id")
    root_id = payload.get("rootId")
    created_by = payload.get("createBy")

    if trigger != "folder.deleted":
        return "", 200

    app.logger.info(f"Folder permanently deleted: {folder_title}")

    try:
        # Step 1: Get user info
        user_info = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/people/{created_by}",
            headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
        ).json()

        email = user_info.get("email")
        full_name = f"{user_info.get('firstName', '')} {user_info.get('lastName', '')}".strip()

        # Step 2: Get folder metadata
        folder_details = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{folder_id}",
            headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
        ).json()

        folder_tags = folder_details.get("response", {}).get("tags", [])
        folder_path = folder_details.get("response", {}).get("path", "")

        # Step 3: If tagged, archive to Box
        if any(tag.lower() in ARCHIVE_TAGS for tag in folder_tags):
            list_res = requests.get(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{folder_id}/list",
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            ).json()

            files = [item for item in list_res.get("response", []) if not item.get("folder")]

            box_folder_res = requests.post(
                "https://api.box.com/2.0/folders",
                json={
                    "name": f"Archive_{folder_title}_{datetime.utcnow().strftime('%Y-%m-%d')}",
                    "parent": {"id": "0"}
                },
                headers={"Authorization": f"Bearer {os.environ.get('BOX_ACCESS_TOKEN')}"}
            ).json()

            box_folder_id = box_folder_res.get("id")

            for file in files:
                download = requests.get(
                    f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{file['id']}/download",
                    headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"},
                    stream=True
                )

                with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                    shutil.copyfileobj(download.raw, tmp_file)
                    temp_file_path = tmp_file.name

                with open(temp_file_path, "rb") as f:
                    files_form = {
                        "attributes": (None, json.dumps({
                            "name": file["title"],
                            "parent": {"id": box_folder_id}
                        })),
                        "file": (file["title"], f)
                    }
                    upload_res = requests.post(
                        "https://upload.box.com/api/2.0/files/content",
                        files=files_form,
                        headers={"Authorization": f"Bearer {os.environ.get('BOX_ACCESS_TOKEN')}"}
                    )
                
                os.unlink(temp_file_path)
                app.logger.info(f"Archived to Box: {file['title']}")

        # Step 4: Notify user with restore link
        if email:
            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": email,
                    "subject": "Folder deleted",
                    "message": f'Your folder "{folder_title}" (ID: {folder_id}) has been permanently deleted.\n'
                               f'If this was a mistake, you can request recovery here:\n'
                               f'{os.environ.get("RESTORE_URL_BASE")}?folderId={folder_id}'
                },
                headers={"Content-Type": "application/json"}
            )

        # Step 5: Notify admin if sensitive path
        if any(keyword in folder_path for keyword in SENSITIVE_PATH_KEYWORDS):
            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Sensitive folder deleted",
                    "message": f'A folder "{folder_title}" (ID: {folder_id}) was permanently deleted by {full_name}.\n'
                               f'Path: {folder_path}\nUser ID: {created_by}'
                },
                headers={"Content-Type": "application/json"}
            )

        return "", 200

    except Exception as err:
        app.logger.error(f"Error handling folder.deleted: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
