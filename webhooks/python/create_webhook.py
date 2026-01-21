import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Function to create the webhook
# Documentation: https://api.onlyoffice.com/docspace/api-backend/usage-api/create-webhook/
def create_webhook(name, uri, secret_key, enabled, ssl, triggers, target_id):
    api_url = os.getenv("PORTAL_URL") + "/api/2.0/settings/webhook"
    api_key = os.getenv("API_KEY")

    data = {
        "name": name,
        "uri": uri,
        "secretKey": secret_key,
        "enabled": enabled,
        "ssl": ssl,
        "triggers": triggers,
        "targetId": target_id
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(api_url, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        print("Webhook created successfully:")
        print(json.dumps(response.json(), indent=2))

    except requests.exceptions.RequestException as e:
        print("Error creating webhook:")
        if e.response is not None:
            print(json.dumps(e.response.json(), indent=2))
        else:
            print(str(e))


# TODO: Replace these values with your own.
name = "My Webhook" # Webhook name
uri = "http://localhost:8080/webhook" # Webhook payload url
secret_key = os.getenv("WEBHOOK_SECRET_KEY")
ssl = True # SSL verification
triggers = 0 # All triggers are selected by default
target_id= "" # Target ID

create_webhook(name, uri, secret_key, True, ssl, triggers, target_id)