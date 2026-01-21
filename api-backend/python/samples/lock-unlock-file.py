'''
Example: Lock and unlock a file

This example demonstrates how to lock or unlock the specified file in ONLYOFFICE DocSpace and get a list of users and their access levels for the file.

Using methods:
- PUT /api/2.0/files/file/{fileId}/lock (https://api.onlyoffice.com/docspace/api-backend/usage-api/lock-file/)
- GET /api/2.0/files/file/{fileId}/protectusers (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-protected-file-users/)
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

# Step 1: Lock a file by ID
def lock_file(file_id):
  url = f'{API_HOST}/api/2.0/files/file/{file_id}/lock'
  data = { 'lockFile': True }

  response = requests.put(url, headers=HEADERS, json=data)

  if response.status_code == 200:
    return response.json()
  else:
    print(f"File lock failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 2: Unlock a file by ID
def unlock_file(file_id):
  url = f'{API_HOST}/api/2.0/files/file/{file_id}/lock'
  data = { 'lockFile': False }

  response = requests.put(url, headers=HEADERS, json=data)

  if response.status_code == 200:
    return response.json()
  else:
    print(f"File unlock failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 3: View users with access to the file
def get_protected_file_users(file_id):
  url = f'{API_HOST}/api/2.0/files/file/{file_id}/protectusers'
  response = requests.get(url, headers=HEADERS)
  if response.status_code == 200:
    return response.json()
  else:
    print(f"Protected file users retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == "__main__":
  file_id = '123456'  # Replace with a valid file ID

  lock_file(file_id)
  unlock_file(file_id)
  get_protected_file_users(file_id)
