'''
Example: Get folder and room contents

This example demonstrates how to retrieve the contents of a folder or room in ONLYOFFICE DocSpace. The same API endpoint returns both files and subfolders.

Using methods:
- GET /api/2.0/files/{folderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-folder-by-folder-id/)
'''

import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}',
  'Accept': 'application/json'
}

# Step 1: Retrieve folder or room contents
def get_folder_contents(folder_id):
  url = f'{API_HOST}/api/2.0/files/{folder_id}'
  response = requests.get(url, headers=HEADERS, timeout=30)

  if response.status_code != 200:
    print(f"Failed to get folder contents. Status code: {response.status_code}, Message: {response.text}")
    return None

  data = response.json()
  if not isinstance(data, dict) or 'response' not in data:
    print(f"Unexpected response format: {data}")
    return None

  contents = data['response']
  files = contents.get('files', [])
  folders = contents.get('folders', [])

  print(f'\nContents of Folder ID {folder_id}:')

  print('\nFiles:')
  for file in files:
    print(f"- {file.get('title', 'No Title')} ({file.get('fileExst', 'Unknown Extension')}) — {file.get('contentLength', 'Unknown Size')}")

  print('\nFolders:')
  for folder in folders:
    print(f"- {folder.get('title', 'No Title')}")

  return contents

if __name__ == '__main__':
  folder_id = 1074098  # Replace with actual folder or room ID
  get_folder_contents(folder_id)
