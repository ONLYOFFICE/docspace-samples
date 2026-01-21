'''
Example: Create an API Key

This example demonstrates how to programmatically generate an API key in ONLYOFFICE DocSpace with specific permissions and an expiration period. 
This is useful when integrating external systems or bots with restricted access scopes.

Using methods:
- POST /api/2.0/keys (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-api-key/)
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

# Step 1: Create an API key
def create_api_key(name, permissions, expires_in_days):
  url = f'{API_HOST}/api/2.0/keys'
  payload = {
    'name': name,
    'permissions': permissions,
    'expiresInDays': expires_in_days
  }

  response = requests.post(url, headers=HEADERS, json=payload)

  if response.status_code == 200:
    data = response.json().get('response', {})
    print('API Key created successfully:')
    print(f'• Name: {data.get('name')}')
    print(f'• Key: {data.get('key')}')
    print(f'• Postfix: {data.get('keyPostfix')}')
    print(f'• Permissions: {data.get('permissions')}')
    print(f'• Expires: {data.get('expiresAt')}')
  else:
    print(f"API key creation failed. Status code: {response.status_code}, Message: {response.text}")


# Run the method
if __name__ == '__main__':
  create_api_key(
    name='Integration Bot',
    permissions=['files:read', 'files:write', 'rooms:read', 'rooms:write'],
    expires_in_days=30
  )
