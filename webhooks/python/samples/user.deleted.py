# Archive, Audit, Group Cleanup on User Deletion (Python Version)

import os
import hmac
import hashlib
import json
from flask import Flask, request, abort
import requests
from datetime import datetime
import tempfile

from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

WEBHOOK_SECRET_KEY = os.getenv("WEBHOOK_SECRET_KEY")
PORTAL_URL = os.getenv("PORTAL_URL")
API_KEY = os.getenv("API_KEY")
ARCHIVE_FOLDER_ID = os.getenv("ARCHIVE_FOLDER_ID")
AUDIT_FOLDER_ID = os.getenv("AUDIT_FOLDER_ID")
NOTIFY_WEBHOOK_URL = os.getenv("NOTIFY_WEBHOOK_URL")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

def verify_signature(secret, payload, signature):
    computed_sig = "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed_sig, signature)

@app.route('/webhook', methods=['POST'])
def webhook():
    sig = request.headers.get('x-docspace-signature-256')
    if not sig or not verify_signature(WEBHOOK_SECRET_KEY, request.data, sig):
        return abort(401)

    event = request.json.get('event', {}).get('trigger')
    if event != 'user.deleted':
        return '', 200

    user = request.json.get('payload')
    full_name = f"{user.get('firstName')} {user.get('lastName')}"
    user_email = user.get('email')
    user_id = user.get('id')
    personal_folder_id = user.get('personalFolderId')

    timestamp = datetime.utcnow().isoformat().replace(':', '-').replace('.', '-')
    log_filename = f"user_deleted_{user_id}_{timestamp}.json"

    headers = {
        'Authorization': f"Bearer {API_KEY}",
        'Content-Type': 'application/json'
    }

    try:
        print(f"Processing deletion of user: {full_name}")

        # Step 1: Move personal folder to archive
        move_payload = {
            "folderIds": [personal_folder_id],
            "folderId": ARCHIVE_FOLDER_ID
        }
        requests.put(f"{PORTAL_URL}/api/2.0/files/move", headers=headers, json=move_payload)
        print("Folder archived")

        # Step 2: Collect group memberships
        groups_res = requests.get(f"{PORTAL_URL}/api/2.0/group", headers=headers)
        groups = groups_res.json().get('response', [])

        user_groups = [g for g in groups if any(m.get('id') == user_id for m in g.get('members', []))]

        # Step 3: Remove from groups
        for group in user_groups:
            remove_payload = {"userIds": [user_id]}
            requests.post(f"{PORTAL_URL}/api/2.0/group/{group['id']}/remove", headers=headers, json=remove_payload)
            print(f"Removed from group: {group['name']}")

        # Step 4: Collect files by user
        files_res = requests.get(
            f"{PORTAL_URL}/api/2.0/files/filter",
            headers=headers,
            params={"createdBy": user_id}
        )
        files = files_res.json().get('response', [])

        # Step 5: Build log file
        report = {
            "userId": user_id,
            "fullName": full_name,
            "email": user_email,
            "deletedAt": datetime.utcnow().isoformat(),
            "groups": [{"id": g['id'], "name": g['name']} for g in user_groups],
            "ownedFiles": [{"id": f['id'], "title": f['title']} for f in files]
        }

        temp_dir = tempfile.gettempdir()
        log_path = os.path.join(temp_dir, log_filename)
        with open(log_path, 'w') as f:
            json.dump(report, f, indent=2)

        # Step 6: Upload log to DocSpace
        with open(log_path, 'rb') as file_data:
            files = {'file': file_data}
            upload_res = requests.post(
                f"{PORTAL_URL}/api/2.0/files/folder/{AUDIT_FOLDER_ID}/upload",
                headers={'Authorization': f"Bearer {API_KEY}"},
                files=files
            )

        file_info = upload_res.json().get('response', [])[0]
        file_url = f"{PORTAL_URL}/file/{file_info['id']}"

        os.remove(log_path)

        # Step 7: Notify admin
        notify_payload = {
            "to": ADMIN_EMAIL,
            "subject": f"User deleted: {full_name}",
            "message": f"User {full_name} ({user_email}) has been deleted.\n\nAudit log: {file_url}"
        }
        requests.post(NOTIFY_WEBHOOK_URL, json=notify_payload, headers={"Content-Type": "application/json"})

        print("Admin notified and log saved")
        return '', 200

    except Exception as e:
        print(f"Error during user deletion handling: {str(e)}")
        return '', 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 3000))
    app.run(host='0.0.0.0', port=port)
