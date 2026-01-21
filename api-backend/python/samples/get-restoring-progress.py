'''
Example: Get the restoring progress

This example demonstrates how to retrieve the progress of an ongoing portal restoration process in ONLYOFFICE DocSpace using the API.

Using methods:
- GET /api/2.0/backup/getrestoreprogress (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-restore-progress/)
'''

import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authentication
HEADERS = {
  'Authorization': API_KEY
}

def get_restore_progress(dump=False):
  # Optional query parameter: whether the restore includes a DB dump
  params = {"Dump": str(dump).lower()}

  # Send GET request to check restore progress
  response = requests.get(
    f'{API_HOST}/api/2.0/backup/getrestoreprogress',
    headers=HEADERS,
    params=params
  )

  if response.status_code == 200:
    progress_info = response.json().get('response', {})
    print(f"Progress: {progress_info.get('progress')}%")
    print(f"Completed: {progress_info.get('isCompleted')}")
    print(f"Task type: {progress_info.get('backupProgressEnum')}")
    print(f"Error: {progress_info.get('error')}")
    print(f"Download link: {progress_info.get('link')}")
    print(f"Tenant ID: {progress_info.get('tenantId')}")
    return progress_info
  else:
    print(f"Restore progress retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == '__main__':
  # Example: Check restore progress without dump parameter
  get_restore_progress(dump=False)
