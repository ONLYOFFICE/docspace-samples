# Log Deleted Group Members and Notify Owner

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
import json
import tempfile
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
    if trigger != "group.deleted":
        return "", 200

    group_id = payload.get("id")
    group_name = payload.get("name")
    created_by = payload.get("createdBy")
    timestamp = datetime.utcnow().isoformat().replace(":", "-").replace(".", "-")
    log_filename = f"deleted_{group_name}_{timestamp}.json"

    app.logger.info(f'Group deleted: {group_name} ({group_id})')

    try:
        # Step 1: Get group members
        group_info = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/group/{group_id}",
            params={"includeMembers": True},
            headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
        ).json()

        members = group_info.get("response", {}).get("members", [])

        # Step 2: Build log object
        log_data = {
            "groupId": group_id,
            "groupName": group_name,
            "deletedAt": datetime.utcnow().isoformat(),
            "members": [
                {
                    "id": m.get("id"),
                    "name": f"{m.get('firstName', '')} {m.get('lastName', '')}".strip(),
                    "email": m.get("email")
                }
                for m in members
            ]
        }

        with tempfile.NamedTemporaryFile(delete=False, suffix=".json", mode="w") as tmpfile:
            json.dump(log_data, tmpfile, indent=2)
            temp_log_path = tmpfile.name

        # Step 3: Upload log file to DocSpace
        with open(temp_log_path, "rb") as f:
            files = {"file": f}
            upload_res = requests.post(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/files/folder/{os.environ.get('GROUPS_LOG_FOLDER_ID')}/upload",
                files=files,
                headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
            ).json()

        os.unlink(temp_log_path)

        uploaded_file = upload_res.get("response", [{}])[0]
        file_url = f"{os.environ.get('PORTAL_URL')}/file/{uploaded_file.get('id')}"

        # Step 4: Get group creator email
        owner_info = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/people/{created_by}",
            headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
        ).json()

        owner_email = owner_info.get("email")

        if owner_email:
            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": owner_email,
                    "subject": f'Group "{group_name}" has been deleted',
                    "message": f'The group "{group_name}" has been permanently deleted.\n\nA log file with all group members has been saved:\n{file_url}'
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info(f"Notification sent to owner: {owner_email}")
        else:
            app.logger.warning("Group creator email not found")

        return "", 200

    except Exception as err:
        app.logger.error(f"Error handling group.deleted: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
