import requests

# Set your DocSpace portal URL and access token
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authorization token
HEADERS = {
  'Authorization': API_KEY
}

# Step 1: Retrieve the current token's permissions
def get_token_permissions():
  url = f'{API_HOST}/api/2.0/keys/permissions'
  response = requests.get(url, headers=HEADERS)

  if response.status_code == 200:
    permissions = response.json().get('response', [])
    print('Current Token Permissions:')
    for perm in permissions:
      print(f'• {perm}')
  else:
    print(f"Key permissions retrieval failed. Status code: {response.status_code}, Message: {response.text}")

# Run the method
if __name__ == '__main__':
  get_token_permissions()
