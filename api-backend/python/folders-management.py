import requests

# Set API base URL
BASE_URL = 'https://yourportal.onlyoffice.com'
API_KEY = 'YOUR_API_KEY'

# Headers with API key for authentication
HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Step 1: Create a Folder
def create_folder(parent_folder_id, folder_name):
    url = f'{BASE_URL}/api/2.0/files/folder/{parent_folder_id}'
    data = {
        'title': folder_name
    }

    requests.post(url, headers=HEADERS, json=data)

# Step 2: Retrieve Folder Details
def get_folder_details(folder_id):
    url = f'{BASE_URL}/api/2.0/files/folder/{folder_id}'
    requests.get(url, headers=HEADERS)

# Step 3: Rename a Folder
def rename_folder(folder_id, new_name):
    url = f'{BASE_URL}/api/2.0/files/folder/{folder_id}/rename'
    data = {
        'title': new_name
    }

    requests.put(url, headers=HEADERS, json=data)

# Step 4: Delete a Folder
def delete_folder(folder_id):
    url = f'{BASE_URL}/api/2.0/files/folder/{folder_id}'
    requests.delete(url, headers=HEADERS)

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