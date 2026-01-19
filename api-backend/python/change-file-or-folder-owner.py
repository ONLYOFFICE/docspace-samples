import requests

# Set your DocSpace portal URL, access token, and IDs
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

HEADERS = {
  'Authorization': API_KEY,
  'Content-Type': 'application/json'
}

# Step 1: Define file and/or folder IDs to transfer
file_ids = [12345]  # Replace with your file IDs
folder_ids = [67890]  # Replace with folder IDs if needed
new_owner_id = 'user_uuid_here'  # New owner's UUID

payload = {
  "fileIds": file_ids,
  "folderIds": folder_ids,
  "userId": new_owner_id
}

# Step 2: Send the ownership change request
def change_ownership(payload):
  url = f'{API_HOST}/api/2.0/files/owner'
  response = requests.post(url, headers=HEADERS, json=payload)

  if response.status_code == 200:
    result = response.json().get('response', [])
    print("Ownership successfully updated for the following items:")
    for entry in result:
      title = entry.get('title', 'Unnamed')
      shared = entry.get('access', {}).get('shared', False)
      print(f"- {title} (Shared: {shared})")
  else:
    print(f"Ownership update failed. Status code: {response.status_code}, Message: {response.text}")

# Run the method
if __name__ == '__main__':
  change_ownership(payload)