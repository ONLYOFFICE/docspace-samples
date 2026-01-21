# Critical group monitoring and external user check

from flask import Flask, request, abort
import hmac
import hashlib
import requests
import os
import json
from datetime import datetime

app = Flask(__name__)

SENSITIVE_GROUP_KEYWORDS = ["hr", "finance", "legal", "management"]
EXTERNAL_DOMAINS = ["external.com"]

# Generate HMAC-SHA256 signature
def get_secret_hash(secret, payload):
    return "sha256=" + hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

@app.route("/webhook", methods=["HEAD"])
def webhook_head():
    return "", 200

@app.route("/webhook", methods=["POST"])
def webhook_post():
    sig = request.headers.get("x-docspace-signature-256")
    if not sig:
        abort(401)

    secret_key = os.environ.get("WEBHOOK_SECRET_KEY")
    raw_body = json.dumps(request.json)
    computed_hash = get_secret_hash(secret_key, raw_body)

    if sig != computed_hash:
        abort(401)

    event_type = request.json.get("event", {}).get("trigger")
    payload = request.json.get("payload", {})
    group_id = payload.get("id")
    group_name = payload.get("name")

    if event_type != "group.updated" or not group_id:
        return "", 200

    app.logger.info(f'Group updated: "{group_name}" ({group_id})')

    try:
        # Step 1: Get updated group info
        group_info_res = requests.get(
            f"{os.environ.get('PORTAL_URL')}/api/2.0/group/{group_id}",
            params={"includeMembers": True},
            headers={"Authorization": f"Bearer {os.environ.get('API_KEY')}"}
        ).json()

        group_info = group_info_res.get("response", {})
        description = group_info.get("description", "[No description]")
        members = group_info.get("members", [])

        # Step 2: Check for sensitive groups
        is_sensitive_group = any(keyword in (group_name or "").lower() for keyword in SENSITIVE_GROUP_KEYWORDS)

        if is_sensitive_group:
            external_users = []

            # Step 3: Check for external users
            for member in members:
                email = member.get("email", "").lower()
                if any(email.endswith("@" + domain) for domain in EXTERNAL_DOMAINS):
                    external_users.append(email)

            external_notice = "\n\nExternal users detected:\n" + "\n".join(f"- {email}" for email in external_users) if external_users else ""

            admin_message = (
                f"Critical group \"{group_name}\" has been updated.\n\n"
                f"Description: {description}\n"
                f"Total Members: {len(members)}\n\n"
                f"Changes detected:{external_notice}\n\n"
                f"Group ID: {group_id}\n"
                f"Time: {datetime.utcnow().isoformat()}"
            )

            requests.post(
                os.environ.get("NOTIFY_WEBHOOK_URL"),
                json={
                    "to": os.environ.get("ADMIN_EMAIL"),
                    "subject": "Critical Group Updated",
                    "message": admin_message
                },
                headers={"Content-Type": "application/json"}
            )

            app.logger.info("Admin notified about critical group update.")

        return "", 200

    except Exception as err:
        app.logger.error(f"Error handling group.updated: {err}")
        return "", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
