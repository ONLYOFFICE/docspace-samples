# Notify Room + Admin + Log Sensitive File Restore

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
import json
import tempfile
from datetime import datetime

app = Flask(__name__)

SENSITIVE_KEYWORDS = ["contract", "finance", "nda"]

# Generate HMAC-SHA256 signature
def get_secret_hash(secret, payload):
    return "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()

# Search for a Box file by name
def search_box_file_by_name(file_name):
    try:
        response = requests.get(
            "https://api.box.com/2.0/search",
            params={
                "query": file_name,
                "type": "file",
                "content_types": "name"
            },
            headers={
                "Authorization": f"Bearer {os.environ.get('BOX_ACCESS_TOKEN')}"
            }
        )
        response.raise_for_status()
        entries = response.json().get("entries", [])
        return next((entry for entry in entries if entry.get("name") == file_name), None)
    except requests.exceptions.RequestException as err:
        app.logger.error(f"Error searching file in Box: {err}")
        return None

# Move a file to Box archive folder
def move_box_file(file_id, folder_id):
    try:
        response = requests.put(
            f"https://api.box.com/2.0/files/{file_id}",
            json={"parent": {"id": folder_id}},
            headers={
                "Authorization": f"Bearer {os.environ.get('BOX_ACCESS_TOKEN')}",
                "Content-Type": "application/json"
            }
        )
        response.raise_for_status()
        app.logger.info(f"File {file_id} moved to Box folder {folder_id}")
    except requests.exceptions.RequestException as err:
        app.logger.error(f"Error moving file in Box: {err}")

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

    if trigger == "file.created":
        app.logger.info(f"New file detected: \"{title}\", room ID: {room_id}")

        lower_title = title.lower() if title else ""

        blocked_extensions = [".exe", ".bat", ".sh", ".zip"]
        is_blocked = any(lower_title.endswith(ext) for ext in blocked_extensions)

        if is_blocked:
            try:
                delete_response = requests.delete(
                    f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{file_id}",
                    headers={
                        "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                        "Content-Type": "application/json"
                    }
                )
                delete_response.raise_for_status()
                app.logger.info(f"Blocked and deleted file \"{title}\" due to disallowed extension")

                notify_response = requests.post(
                    os.environ.get("NOTIFY_WEBHOOK_URL"),
                    json={
                        "to": os.environ.get("ADMIN_EMAIL"),
                        "subject": "Blocked file upload",
                        "message": f"User ID {created_by} attempted to upload file \"{title}\" with a forbidden extension. The file was deleted."
                    },
                    headers={"Content-Type": "application/json"}
                )
                notify_response.raise_for_status()

                return "", 200

            except requests.exceptions.RequestException as err:
                app.logger.error(f"Error deleting blocked file: {err}")
                return "", 500

        classification_rules = [
            {"keyword": "invoice", "tag": "Finance", "target_folder_id": os.environ.get("FOLDER_ID_FINANCE")},
            {"keyword": "contract", "tag": "Legal", "target_folder_id": os.environ.get("FOLDER_ID_LEGAL")},
            {"keyword": "nda", "tag": "Confidential", "target_folder_id": os.environ.get("FOLDER_ID_CONFIDENTIAL")}
        ]

        matched_rule = next((rule for rule in classification_rules if rule["keyword"] in lower_title), None)

        if matched_rule:
            try:
                update_response = requests.put(
                    f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{file_id}",
                    json={"tags": [matched_rule["tag"]]},
                    headers={
                        "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                        "Content-Type": "application/json"
                    }
                )
                update_response.raise_for_status()

                move_response = requests.post(
                    f"{os.environ.get('PORTAL_URL')}/api/2.0/files/move",
                    json={"fileIds": [file_id], "folderId": matched_rule["target_folder_id"]},
                    headers={
                        "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                        "Content-Type": "application/json"
                    }
                )
                move_response.raise_for_status()

                app.logger.info(f"Classified \"{title}\" as \"{matched_rule['tag']}\" and moved to folder {matched_rule['target_folder_id']}")
                return "", 200

            except requests.exceptions.RequestException as err:
                app.logger.error(f"Error classifying or moving file: {err}")
                return "", 500

        return "", 200

    if trigger == "file.deleted":
        app.logger.info(f"File deleted in DocSpace: \"{title}\"")

        try:
            box_file = search_box_file_by_name(title)
            if box_file:
                move_box_file(box_file.get("id"), os.environ.get("BOX_ARCHIVE_FOLDER_ID"))
            else:
                app.logger.info(f"No matching file found in Box: \"{title}\"")

            return "", 200
        except Exception as err:
            app.logger.error(f"Error during Box archive process: {err}")
            return "", 500

    if trigger == "file.restored":
        app.logger.info(f"File restored: \"{title}\"")

        try:
            share_response = requests.get(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/files/rooms/{room_id}/share",
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            )
            share_response.raise_for_status()
            users = share_response.json().get("access", [])

            for user in users:
                email = user.get("sharedTo", {}).get("email")
                if email:
                    requests.post(
                        os.environ.get("NOTIFY_WEBHOOK_URL"),
                        json={
                            "to": email,
                            "subject": "File restored",
                            "message": f"The file \"{title}\" has been restored in Room #{room_id}."
                        },
                        headers={"Content-Type": "application/json"}
                    )
                    app.logger.info(f"Notified user: {email}")

            lower_title = title.lower()
            if any(keyword in lower_title for keyword in SENSITIVE_KEYWORDS):
                user_info = requests.get(
                    f"{os.environ.get('PORTAL_URL')}/api/2.0/people/{created_by}",
                    headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
                ).json()
                user_email = user_info.get("email", "unknown")
                user_name = f"{user_info.get('firstName', '')} {user_info.get('lastName', '')}".strip()

                with tempfile.NamedTemporaryFile(delete=False, suffix=".json", mode="w") as tmpfile:
                    json.dump({
                        "fileId": file_id,
                        "title": title,
                        "restoredAt": datetime.utcnow().isoformat(),
                        "roomId": room_id,
                        "restoredBy": {"userId": created_by, "name": user_name, "email": user_email}
                    }, tmpfile, indent=2)
                    tmpfile_path = tmpfile.name

                with open(tmpfile_path, "rb") as f:
                    upload_response = requests.post(
                        f"{os.environ.get('PORTAL_URL')}/api/2.0/files/folder/{os.environ.get('RESTORE_LOG_FOLDER_ID')}/upload",
                        files={"file": f},
                        headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
                    ).json()

                os.unlink(tmpfile_path)

                log_id = upload_response.get("response", [{}])[0].get("id")
                log_url = f"{os.environ.get('PORTAL_URL')}/file/{log_id}"

                requests.post(
                    os.environ.get("NOTIFY_WEBHOOK_URL"),
                    json={
                        "to": os.environ.get("ADMIN_EMAIL"),
                        "subject": "Sensitive file restored",
                        "message": f"The sensitive file \"{title}\" was restored by {user_name} ({user_email}).\n\nRoom ID: {room_id}\nLog: {log_url}"
                    },
                    headers={"Content-Type": "application/json"}
                )
                app.logger.info("Admin notified about sensitive restore")

            return "", 200

        except Exception as err:
            app.logger.error(f"Error in file.restored handler: {err}")
            return "", 500

    return "", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
