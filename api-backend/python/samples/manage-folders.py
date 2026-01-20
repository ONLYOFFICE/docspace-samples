'''
Example: Manage folders

This example demonstrates how to manage folders in ONLYOFFICE DocSpace using the API.
It covers creating, retrieving, renaming, and deleting folders through API requests.

Using methods:
- POST /api/2.0/files/folder/{parentFolderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-folder/)
- GET /api/2.0/files/folder/{folderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-folder-info/)
- PUT /api/2.0/files/folder/{folderId}/rename (https://api.onlyoffice.com/docspace/api-backend/usage-api/rename-folder/)
- DELETE /api/2.0/files/folder/{folderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-folder/)
'''

import requests

# Set API base URL
BASE_URL = 'https://yourportal.onlyoffice.com'
API_KEY = 'YOUR_API_KEY'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}',
  'Content-Type': 'application/json'
}

# Step 1: Create a folder
def create_folder(parent_folder_id, folder_name):
  url = f'{BASE_URL}/api/2.0/files/folder/{parent_folder_id}'
  data = {
    'title': folder_name
  }

  response = requests.post(url, headers=HEADERS, json=data)
  if response.status_code == 200:
    print("Folder created successfully.")
  else:
    print(f"Folder creation failed. Status code: {response.status_code}, Message: {response.text}")


# Step 2: Retrieve folder details
def get_folder_details(folder_id):
  url = f'{BASE_URL}/api/2.0/files/folder/{folder_id}'
  response = requests.get(url, headers=HEADERS)
  if response.status_code == 200:
    print(f"Folder details: {response.json()}")
  else:
    print(f"Folder details retrieval failed. Status code: {response.status_code}, Message: {response.text}")


# Step 3: Rename a folder
def rename_folder(folder_id, new_name):
  url = f'{BASE_URL}/api/2.0/files/folder/{folder_id}/rename'
  data = {
    'title': new_name
  }

  response = requests.put(url, headers=HEADERS, json=data)
  if response.status_code == 200:
    print("Folder rename succeeded.")
  else:
    print(f"Folder rename failed. Status code: {response.status_code}, Message: {response.text}")


# Step 4: Delete a folder
def delete_folder(folder_id):
  url = f'{BASE_URL}/api/2.0/files/folder/{folder_id}'
  response = requests.delete(url, headers=HEADERS)
  if response.status_code == 200:
    print("Folder deletion succeeded.")
  else:
    print(f"Folder deletion failed. Status code: {response.status_code}, Message: {response.text}")


def main():
  parent_folder_id = 1234 # Replace with actual parent folder or room ID
  folder_id = 1234 # Replace with actual folder ID
  folder_name = "New Folder" # Replace with actual folder name
  new_folder_name = "Updated Folder Name" # Replace with actual new folder name

  #Step 1
  create_folder(parent_folder_id, folder_name)

  #Step 2
  get_folder_details(folder_id)

  #Step 3
  rename_folder(folder_id, new_folder_name)

  #Step 4
  delete_folder(folder_id)
