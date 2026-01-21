'''
Example: Copy or move a file to a folder

This example demonstrates how to copy or move a file in ONLYOFFICE DocSpace.

Using methods:
- PUT /api/2.0/files/fileops/copy (https://api.onlyoffice.com/docspace/api-backend/usage-api/copy-batch-items/)
- PUT /api/2.0/files/fileops/move (https://api.onlyoffice.com/docspace/api-backend/usage-api/move-batch-items/)
'''

import requests

# Set API base URL
API_HOST = "https://yourportal.onlyoffice.com"
API_KEY = "your_api_key"

# Headers with API key for authentication
HEADERS = {
  "Authorization": f"Bearer {API_KEY}",
  "Content-Type": "application/json"
}

# Step 1: Copy a file to another folder
def copy_file_to_folder(file_id: int, dest_folder_id: int):
  url = f"{API_HOST}/api/2.0/files/fileops/copy"
  payload = {
    "fileIds": [file_id],
    "destFolderId": dest_folder_id,
    "deleteAfter": False,  # Copy, do not remove original
    "content": True,
    "toFillOut": False
  }

  response = requests.put(url, json=payload, headers=HEADERS)
  if response.status_code == 200:
    print(f"File {file_id} copied to folder {dest_folder_id}")
  else:
    print(f"Copy failed. Status code: {response.status_code}, Message: {response.text}")


# Step 2: Move a file to another folder
def move_file_to_folder(file_id: int, dest_folder_id: int):
  url = f"{API_HOST}/api/2.0/files/fileops/move"
  payload = {
    "fileIds": [file_id],
    "destFolderId": dest_folder_id,
    "deleteAfter": True,   # Move means remove from original
    "content": True,
    "toFillOut": False
  }

  response = requests.put(url, json=payload, headers=HEADERS)
  if response.status_code == 200:
    print(f"File {file_id} moved to folder {dest_folder_id}")
  else:
    print(f"Move failed. Status code: {response.status_code}, Message: {response.text}")

# Run an example
if __name__ == "__main__":
  file_id = 1568550         # ID of the file
  dest_folder_id = 1079053  # ID of the destination folder

  copy_file_to_folder(file_id, dest_folder_id)
  move_file_to_folder(file_id, dest_folder_id)