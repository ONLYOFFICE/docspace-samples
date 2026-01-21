'''
Example: Get backup history

This example demonstrates how to retrieve the list of existing backups in ONLYOFFICE DocSpace using the API.
The history contains information about backup IDs, file names, storage types, and creation/expiration dates.

Using methods:
- GET /api/2.0/backup/getbackuphistory (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-backup-history/)
'''

import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authentication
HEADERS = {
  'Authorization': API_KEY
}

def get_backup_history():
  # Optional: set Dump=True for DB-only backups
  params = {'Dump': False}

  # Send request to retrieve backup history
  response = requests.get(
    f'{API_HOST}/api/2.0/backup/getbackuphistory',
    headers=HEADERS,
    params=params
  )

  # Handle and display response
  if response.status_code == 200:
    backups = response.json().get('response', [])
    for item in backups:
      print(f"Backup ID: {item.get('id')}")
      print(f"File: {item.get('fileName')}")
      print(f"Storage: {item.get('storageType')}")
      print(f"Created: {item.get('createdOn')}")
      print(f"Expires: {item.get('expiresOn')}\n")
  else:
    print(f"Backup history retrieval failed. Status code: {response.status_code}, Message: {response.text}")

if __name__ == "__main__":
  get_backup_history()
