# Auto-Structure and Access Based on Room Name

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os

app = Flask(__name__)

# Generate HMAC-SHA256 signature
def get_secret_hash(secret, payload):
    return "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()

# Create default subfolders in a new room
def create_subfolders(room_id):
    folder_names = ["Documents", "Tasks", "Files", "Reports"]
    for name in folder_names:
        requests.post(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/folder/{room_id}",
            json={"title": name},
            headers={
                "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                "Content-Type": "application/json"
            }
        )
        app.logger.info(f"Subfolder created: {name}")

# Assign group access based on room title
def assign_access(room_id, room_title):
    access_list = []

    if room_title.startswith("HR_"):
        access_list.append(os.environ.get("HR_GROUP_ID"))
    elif room_title.startswith("Project_"):
        access_list.append(os.environ.get("PROJECT_TEAM_GROUP_ID"))
    elif room_title.startswith("Clients_"):
        access_list.append(os.environ.get("SALES_GROUP_ID"))
        access_list.append(os.environ.get("LEGAL_GROUP_ID"))

    for group_id in access_list:
        requests.post(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/files/rooms/{room_id}/share",
            json={
                "shareTo": [
                    {
                        "id": group_id,
                        "isGroup": True,
                        "permissions": {
                            "read": True,
                            "edit": True,
                            "download": True
                        }
                    }
                ]
            },
            headers={
                "Authorization": f"Bearer {os.environ.get('API_KEY')}",
                "Content-Type": "application/json"
            }
        )
        app.logger.info(f"Access granted to group {group_id}")

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
    room_id = payload.get("rootId")

    if trigger == "room.created":
        app.logger.info(f'New room created: "{room_title}"')

        try:
            create_subfolders(room_id)
            assign_access(room_id, room_title)
            return "", 200
        except Exception as err:
            app.logger.error(f"Error during room setup: {err}")
            return "", 500

    return "", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
