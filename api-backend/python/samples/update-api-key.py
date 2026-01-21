'''
Example: Update an API Key

This example demonstrates how to update an existing API key in DocSpace using the API.
You can change the name, permissions, or status of the key by providing its unique ID (UUID).

Using methods:
- PUT /api/2.0/keys/{keyId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-api-key/)
'''

import requests

# Set your DocSpace portal URL and access token
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authorization token
HEADERS = {
  'Authorization': API_KEY,
  'Content-Type': 'application/json'
}

# Step 1: Update an API key
def update_api_key(key_id, new_name, new_permissions, is_active=True):
  url = f'{API_HOST}/api/2.0/keys/{key_id}'
  payload = {
    'name': new_name,
    'permissions': new_permissions,
    'isActive': is_active
  }

  response = requests.put(url, headers=HEADERS, json=payload)

  if response.status_code == 200 and response.json().get('response') is True:
    print('API key updated successfully.')
  else:
    print(f"API key update failed. Status code: {response.status_code}, Message: {response.text}")

# Example usage
if __name__ == '__main__':
  update_api_key(
    key_id='your_key_uuid',
    new_name='Updated Integration Bot Key',
    new_permissions=[
      'files:read',
      'files:write',
      'rooms:read',
      'rooms:write',
      'accounts:read'
    ],
    is_active=True
  )
