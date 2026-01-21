'''
Example: List groups managed by a user

This example demonstrates how to retrieve the list of groups in ONLYOFFICE DocSpace that are managed by a specific user.

Using methods:
- GET /api/2.0/group (https://api.onlyoffice.com/samples/docspace/api-backend/basic-samples/list-groups-managed-by-user/)
'''

import requests

# Set your DocSpace portal URL and API key
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key
HEADERS = {
  'Accept': 'application/json',
  'Authorization': f'Bearer {API_KEY}'
}

# Step 1: Get groups managed by a specific user
def get_managed_groups(manager_id: str):
  url = f'{API_HOST}/api/2.0/group'
  params = {
    'manager': True,      # return groups where the given user is a manager
    'userId': manager_id  # manager's UUID
  }
  response = requests.get(url, headers=HEADERS, params=params)

  if response.status_code == 200:
    groups = response.json().get('response', [])
    print(f'Found {len(groups)} group(s) managed by {manager_id}:')
    for g in groups:
      print(f'- {g.get('id')} — {g.get('name')}')
    return groups
  else:
    print(f"Managed groups retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Run the method
if __name__ == '__main__':
  get_managed_groups('4c65a238-ca50-4374-b904-0d51d4c1822b')  # Replace with manager UUID
