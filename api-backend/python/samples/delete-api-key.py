'''
Example: Delete an API Key

This example demonstrates how to delete an existing API key in ONLYOFFICE DocSpace by its unique identifier (UUID). 
Use this operation to revoke a key that is no longer needed or compromised.

Using methods:
- DELETE /api/2.0/keys/{keyId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-api-key/)
'''

import requests

# Set your DocSpace portal URL and access token
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authorization token
HEADERS = {
  'Authorization': API_KEY
}

# Step 1: Delete the API key by ID
def delete_api_key(key_id):
  url = f'{API_HOST}/api/2.0/keys/{key_id}'
  response = requests.delete(url, headers=HEADERS)

  if response.status_code == 200 and response.json().get('response') is True:
    print('API key deleted successfully.')
  else:
    print(f"API key deletion failed. Status code: {response.status_code}, Message: {response.text}")

# Run the method
if __name__ == '__main__':
  delete_api_key('your_key_uuid')
