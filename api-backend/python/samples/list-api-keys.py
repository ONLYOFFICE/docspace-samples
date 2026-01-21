'''
Example: List API keys

This example demonstrates how to retrieve all API keys associated with the current user in ONLYOFFICE DocSpace.
The response includes metadata such as name, permissions, status, and expiration date.

Using methods:
- GET /api/2.0/keys (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-api-keys/)
'''

import requests

# Set your DocSpace portal URL and access token
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authorization token
HEADERS = {
  'Authorization': API_KEY
}

# Step 1: Get all API keys for the current user
def list_api_keys():
  url = f'{API_HOST}/api/2.0/keys'
  response = requests.get(url, headers=HEADERS)

  if response.status_code == 200:
    keys = response.json().get('response', [])
    print(f'Found {len(keys)} API key(s):')
    for key in keys:
      print(f'\n• Name: {key.get('name')}')
      print(f'  Postfix: {key.get('keyPostfix')}')
      print(f'  Active: {key.get('isActive')}')
      print(f'  Permissions: {key.get('permissions')}')
      print(f'  Created on: {key.get('createOn')}')
      print(f'  Last used: {key.get('lastUsed')}')
      print(f'  Expires at: {key.get('expiresAt')}')
  else:
    print(f"API keys retrieval failed. Status code: {response.status_code}, Message: {response.text}")

# Run the method
if __name__ == '__main__':
  list_api_keys()
