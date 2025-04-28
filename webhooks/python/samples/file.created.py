# Block Disallowed File Types and Auto-Classify Uploaded Files

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

    if trigger == "file.created":
        app.logger.info(f"New file detected: \"{title}\", room ID: {room_id}")

        lower_title = title.lower() if title else ""

        # Block upload if file has disallowed extension
        blocked_extensions = [".exe", ".bat", ".sh", ".zip"]
        is_blocked = any(lower_title.endswith(ext) for ext in blocked_extensions)

        if is_blocked:
            try:
                # Delete the blocked file
                delete_response = requests.delete(
                    f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{file_id}",
                    headers={
                        "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                        "Content-Type": "application/json"
                    }
                )
                delete_response.raise_for_status()

                app.logger.info(f"Blocked and deleted file \"{title}\" due to disallowed extension")

                # Notify admin
                notify_response = requests.post(
                    os.environ.get("NOTIFY_WEBHOOK_URL"),
                    json={
                        "to": os.environ.get("ADMIN_EMAIL"),
                        "subject": "Blocked file upload",
                        "message": f"User ID {created_by} attempted to upload file \"{title}\" with a forbidden extension. The file was deleted."
                    },
                    headers={
                        "Content-Type": "application/json"
                    }
                )
                notify_response.raise_for_status()

                return "", 200

            except requests.exceptions.RequestException as err:
                app.logger.error(f"Error deleting blocked file: {err}")
                return "", 500

        # Classify files based on title
        classification_rules = [
            {
                "keyword": "invoice",
                "tag": "Finance",
                "target_folder_id": os.environ.get("FOLDER_ID_FINANCE")
            },
            {
                "keyword": "contract",
                "tag": "Legal",
                "target_folder_id": os.environ.get("FOLDER_ID_LEGAL")
            },
            {
                "keyword": "nda",
                "tag": "Confidential",
                "target_folder_id": os.environ.get("FOLDER_ID_CONFIDENTIAL")
            }
        ]

        matched_rule = next((rule for rule in classification_rules if rule["keyword"] in lower_title), None)

        if matched_rule:
            try:
                # Assign tag
                update_response = requests.put(
                    f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{file_id}",
                    json={"tags": [matched_rule["tag"]]},
                    headers={
                        "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                        "Content-Type": "application/json"
                    }
                )
                update_response.raise_for_status()

                # Move to target folder
                move_response = requests.post(
                    f"{os.environ.get('PORTAL_URL')}/api/2.0/files/move",
                    json={
                        "fileIds": [file_id],
                        "folderId": matched_rule["target_folder_id"]
                    },
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

    return "", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
