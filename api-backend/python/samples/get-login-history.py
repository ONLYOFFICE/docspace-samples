'''
Example: Get login history

This example automates the retrieval of the last login events in ONLYOFFICE DocSpace.
It extracts unique user IDs from the latest login records, ensuring that duplicate entries are removed.

Using methods:
- GET /api/2.0/security/audit/login/last (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-last-login-events/)
'''

import requests

# Set API base URL
API_HOST = 'yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Accept': 'application/json',
  'Authorization': f'Bearer {API_KEY}',
  'Content-Type': 'application/json'
}

def get_last_login_users():
  url = f'https://{API_HOST}/api/2.0/security/audit/login/last'
  response = requests.get(url, headers=HEADERS)
  if response.status_code == 200:
    res = response.json()
    user_ids = list(set(map(lambda user: user["userId"], res["response"])))
    print(f'Last login users: {user_ids}')
    return user_ids
  else:
    print(f"Last login users retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == "__main__":
  user_ids = get_last_login_users()
  print(user_ids)
