'''
Example: Manage user photo

This example demonstrates how to upload and delete user profile photos in ONLYOFFICE DocSpace using API requests.
Managing user profile pictures helps create a personalized and professional experience within the system.

Using methods:
- PUT /api/2.0/people/{userId}/photo (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-member-photo/)
- DELETE /api/2.0/people/{userId}/photo (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-member-photo/)
'''

import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Accept': 'application/json',
  'Authorization': f'Bearer {API_KEY}',
  'Content-Type': 'application/json'
}

# Step 1: Upload user photo
def upload_user_photo(user_id, photo_url):
  url = f'{API_HOST}/api/2.0/people/{user_id}/photo'
  data = {"files": photo_url}

  response = requests.put(url, json=data, headers=HEADERS)
  if response.status_code == 200:
    print(f'User photo uploaded successfully for {user_id}')
  else:
    print(f'Failed to upload user photo: {response.status_code} - {response.text}')

# Step 2: Delete user photo
def delete_user_photo(user_id):
  url = f'{API_HOST}/api/2.0/people/{user_id}/photo'
  response = requests.delete(url, headers=HEADERS)
  if response.status_code == 200:
    print(f'User photo deleted successfully for {user_id}')
  else:
    print(f'Failed to delete user photo: {response.status_code} - {response.text}')

if __name__ == "__main__":
  user_id = "10001"
  # Replace with your image URL
  photo_url = "https://github.com/ONLYOFFICE/DocSpace-client/blob/master/public/appIcon-192.png?raw=true"

  # Step 1: Upload a new user photo
  upload_user_photo(user_id, photo_url)
  
  # Step 2: Delete user photo
  delete_user_photo(user_id)
