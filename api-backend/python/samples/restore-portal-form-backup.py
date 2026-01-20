'''
Example: Restore portal from a backup

This example demonstrates how to restore an ONLYOFFICE DocSpace portal from a specific backup using the API.
You can specify the backup ID, storage type, and optional parameters such as user notifications and dump usage.

Using methods:
- POST /backup/startrestore (https://api.onlyoffice.com/docspace/api-backend/usage-api/start-backup-restore/)
'''

import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authentication
HEADERS = {
  'Authorization': API_KEY,
  'Content-Type': 'application/json'
}

def restore_portal():
  # Restore payload: specify backup ID, storage type, and options
  payload = {
    "backupId": "your-backup-id",  # Obtained from GET /backup/getbackuphistory
    "storageType": "Local",        # Or "CustomCloud", "DataStore"
    "notify": True,                # Send notifications to users
    "dump": True                   # Use dump if required
  }

  # Send request to start restoration
  response = requests.post(
    f'{API_HOST}/api/2.0/backup/startrestore',
    headers=HEADERS,
    json=payload
  )

  # Handle API response
  if response.status_code == 200:
    result = response.json().get('response', {})
    print(f"Restoration started. Progress: {result.get('progress')}%")
  else:
    print(f"Restore start failed. Status code: {response.status_code}, Message: {response.text}")

if __name__ == "__main__":
  restore_portal()
