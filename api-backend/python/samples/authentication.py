'''
Example: Authenticate a user

This example demonstrates how to authenticate a user in ONLYOFFICE DocSpace using the API and check the authentication with a token received.

Using methods:
- POST /api/2.0/authentication (https://api.onlyoffice.com/docspace/api-backend/usage-api/authenticate-me/)
- GET /api/2.0/authentication (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-is-authentificated/)
'''

import requests

# Set API base URL
BASE_URL = 'https://yourportal.onlyoffice.com'

# User credentials for authentication
USER_CREDENTIALS = {
  'userName': 'your-user-name',
  'password': 'your-password',
}

# Step 1: Authenticate with your login and password
def authenticate():
  response = requests.post(f'{BASE_URL}/api/2.0/authentication', json=USER_CREDENTIALS)
  if response.status_code == 200:
    auth_token = response.json().get('response', {}).get('token')
    if auth_token:
      return auth_token
  else:
    print(f'Authentication failed. Status code: {response.status_code}, Message: {response.text}')
  return None

# Step 2: Check authentication with a token you received
def check_authentication(token):
  headers = {'Authorization': token}
  response = requests.get(f'{BASE_URL}/api/2.0/authentication', headers=headers)
  if response.status_code == 200:
    print(f'User is authenticated with token {token}.')
  else:
    print(f'Authentication check failed. Status code: {response.status_code}, Message: {response.text}')

  if __name__ == '__main__':
    # Step 1
    token = authenticate()

  if token:
    # Step 2
    check_authentication(token)