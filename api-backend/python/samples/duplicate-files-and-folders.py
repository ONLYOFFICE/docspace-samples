'''
Example: Duplicate files and folders

This example demonstrates how to duplicate one or more files and folders in ONLYOFFICE DocSpace using the API. 
The duplicated items will appear in the same location with a modified title.

Using methods:
- PUT /api/2.0/files/fileops/duplicate (https://api.onlyoffice.com/docspace/api-backend/usage-api/duplicate-batch-items/)
'''

import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}',
  'Content-Type': 'application/json'
}

# File and folder IDs to duplicate
FILE_IDS = [111111, 222222]
FOLDER_IDS = [333333, 444444]

# Step 1: Duplicate specified files and folders
def duplicate_files_and_folders(file_ids, folder_ids):
  url = f'{API_HOST}/api/2.0/files/fileops/duplicate'
  data = {
    'fileIds': file_ids,
    'folderIds': folder_ids
  }

  response = requests.put(url, headers=HEADERS, json=data)

  if response.status_code == 200:
    return response.json()
  else:
    print(f"Duplication failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == "__main__":
  duplicate_files_and_folders(FILE_IDS, FOLDER_IDS)
