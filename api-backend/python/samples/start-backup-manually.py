'''
Example: Start a backup manually

This example demonstrates how to start a backup in ONLYOFFICE DocSpace on demand via the API.
You can specify the target storage type and whether to include a full portal dump in the backup.

Using methods:
- POST /api/2.0/backup/startbackup (https://api.onlyoffice.com/docspace/api-backend/usage-api/start-backup/)
'''

import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authentication
HEADERS = {
  'Authorization': API_KEY,
  'Content-Type': 'application/json'
}

def start_backup():
  # Backup payload: Local storage, full portal dump
  payload = {
    "storageType": "Local",  # Or "CustomCloud", "DataStore"
    "dump": True
  }

  # Send request to start backup
  response = requests.post(
    f'{API_HOST}/api/2.0/backup/startbackup',
    headers=HEADERS,
    json=payload
  )

  # Handle API response
  if response.status_code == 200:
    result = response.json().get('response', {})
    print(f"Backup task started. Progress: {result.get('progress')}%")
  else:
    print(f"Backup start failed. Status code: {response.status_code}, Message: {response.text}")

if __name__ == "__main__":
  start_backup()