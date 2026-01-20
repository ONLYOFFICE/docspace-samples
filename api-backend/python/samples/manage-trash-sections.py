'''
Example: Manage the Trash section

This example demonstrates how to retrieve, restore, and empty the contents of the Trash section in ONLYOFFICE DocSpace using the API.

Using methods:
- GET /api/2.0/files/@trash (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-trash-folder/)
- PUT /api/2.0/files/fileops/emptytrash (https://api.onlyoffice.com/docspace/api-backend/usage-api/empty-trash/)
- PUT /api/2.0/files/fileops/move (https://api.onlyoffice.com/docspace/api-backend/usage-api/move-batch-items/)
'''

import requests
import json

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}',
  'Content-Type': 'application/json'
}

# Step 1: Get contents of the Trash section
def get_trash_section():
  url = f'{API_HOST}/api/2.0/files/@trash'
  response = requests.get(url, headers=HEADERS)

  if response.status_code == 200:
    return response.json()
  else:
    print(f'Failed to get Trash: {response.status_code} - {response.text}')
    return None

# Step 2: Empty the Trash section
def empty_trash():
  url = f'{API_HOST}/api/2.0/files/fileops/emptytrash'
  response = requests.put(url, headers=HEADERS)

  if response.status_code == 200:
    return True
  else:
    print(f'Failed to empty Trash: {response.status_code} - {response.text}')
    return False

# Step 3: Restore a file from Trash to a specific folder
def restore_file(file_id, dest_folder_id):
  url = f'{API_HOST}/api/2.0/files/fileops/move'
  data = {
    'fileIds': [file_id],
    'destFolderId': dest_folder_id,
    'deleteAfter': True,
    'content': True
  }

  response = requests.put(url, headers=HEADERS, data=json.dumps(data))

  if response.status_code == 200:
    print(f'File {file_id} restored to folder {dest_folder_id}.')
    return True
  else:
    print(f'Failed to restore file {file_id}: {response.status_code} - {response.text}')
    return False

if __name__ == "__main__":
  get_trash_section()

  file_id = '123456'       # Replace with a real file ID from Trash
  folder_id = '654321'     # Replace with destination folder ID
  restore_file(file_id, folder_id)

  empty_trash()
