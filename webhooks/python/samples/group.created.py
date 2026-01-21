# Create Room and Generate NDA for Each Group Member

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

# Send notification to HR
def notify_hr(subject, message):
    try:
        requests.post(
            os.environ.get("NOTIFY_WEBHOOK_URL"),
            json={
                "to": os.environ.get("HR_EMAIL"),
                "subject": subject,
                "message": message
            },
            headers={"Content-Type": "application/json"}
        )
        app.logger.info(f"HR notified: {subject}")
    except Exception as err:
        app.logger.error(f"Failed to notify HR: {err}")

# Create a new Room
def create_room(title):
    response = requests.post(
        f"{os.environ.get('PORTAL_URL')}/api/2.0/files/room",
        json={"title": title},
        headers={
            "Authorization": f"Bearer {os.environ.get('API_KEY')}",
            "Content-Type": "application/json"
        }
    )
    return response.json()["response"]

# Create subfolders inside a Room
def create_subfolders(room_id, folders):
    for folder_name in folders:
        requests.post(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/folder/{room_id}",
            json={"title": folder_name},
            headers={
                "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                "Content-Type": "application/json"
            }
        )
        app.logger.info(f"Subfolder created: {folder_name}")

# Assign group access to a Room
def assign_group_access(room_id, group_id):
    requests.post(
        f"{os.environ.get('PORTAL_URL')}/api/2.0/files/rooms/{room_id}/share",
        json={
            "shareTo": [{
                "id": group_id,
                "isGroup": True,
                "permissions": {"read": True, "edit": True, "download": True}
            }]
        },
        headers={
            "Authorization": f"Bearer {os.environ.get('API_KEY')}",
            "Content-Type": "application/json"
        }
    )
    app.logger.info(f"Access assigned to group ID {group_id}")

# Get group members
def get_group_members(group_id):
    response = requests.get(
        f"{os.environ.get('PORTAL_URL')}/api/2.0/group/{group_id}",
        params={"includeMembers": True},
        headers={
            "Authorization": f"Bearer {os.environ.get('API_KEY')}",
            "Content-Type": "application/json"
        }
    )
    return response.json()["response"].get("members", [])

# Copy NDA template for each user
def generate_ndas(members, target_folder_id):
    for member in members:
        first_name = member.get("firstName", "User")
        last_name = member.get("lastName", "Unknown")
        new_title = f"NDA_{first_name}_{last_name}.docx"

        requests.post(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/copy",
            json={
                "fileId": os.environ.get("NDA_TEMPLATE_FILE_ID"),
                "folderId": target_folder_id,
                "title": new_title
            },
            headers={
                "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                "Content-Type": "application/json"
            }
        )
        app.logger.info(f"NDA generated for {first_name} {last_name}")

@app.route("/webhook", methods=["POST"])
def webhook():
    signature = request.headers.get("x-docspace-signature-256")
    computed_signature = get_secret_hash(
        os.environ.get("WEBHOOK_SECRET_KEY"),
        json.dumps(request.json)
    )

    if signature != computed_signature:
        app.logger.warning("Invalid signature")
        abort(401)

    event = request.json.get("event", {})
    payload = request.json.get("payload", {})

    trigger = event.get("trigger")
    if trigger == "group.created":
        try:
            group_id = payload.get("id")
            group_name = payload.get("name")

            # Step 1: Create Room
            room = create_room(group_name)

            # Step 2: Create Subfolders
            subfolders = ["Plan", "Files", "Reports"]
            create_subfolders(room["id"], subfolders)

            # Step 3: Assign access to group
            assign_group_access(room["id"], group_id)

            # Step 4: Get members of the group
            members = get_group_members(group_id)

            # Step 5: Find ID of "Files" folder
            files_folder_res = requests.get(
                f"{os.environ.get('PORTAL_URL')}/api/2.0/files/{room['id']}/list",
                headers={
                    "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                    "Content-Type": "application/json"
                }
            ).json()

            files_folder = next(
                (item for item in files_folder_res.get("response", []) if item.get("title") == "Files" and item.get("folder")),
                None
            )

            if not files_folder:
                raise Exception("Files folder not found in the new room")

            # Step 6: Generate NDA files
            generate_ndas(members, files_folder["id"])

            # Step 7: Notify HR
            notify_hr(
                "New group setup complete",
                f'Room for group "{group_name}" has been created. NDAs for each member have been generated.'
            )

            return "", 200

        except Exception as err:
            app.logger.error(f"Error handling group.created event: {err}")
            return "", 500

    return "", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
