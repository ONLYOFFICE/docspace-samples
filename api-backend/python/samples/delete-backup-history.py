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

def delete_backup_history(dump=False):
  # Optional query parameter: dump backups or not
  params = {"Dump": str(dump).lower()}

  # Send DELETE request to remove backup history
  response = requests.delete(
    f'{API_HOST}/api/2.0/backup/deletebackuphistory',
    headers=HEADERS,
    params=params
  )

  if response.status_code == 200:
    result = response.json().get('response')
    print(f"Backup history deleted: {result}")
    return result
  else:
    raise Exception(f"Failed to delete backup history: {response.status_code} - {response.text}")

if __name__ == '__main__':
  # Example: Delete history without dump backups
  delete_backup_history(dump=False)
