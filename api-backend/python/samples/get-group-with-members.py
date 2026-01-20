'''
Example: Get a group with members

This example demonstrates how to retrieve a group by ID in ONLYOFFICE DocSpace and include its members in the response.

Using methods:
- GET /api/2.0/group/{groupId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-group/)
'''

import requests

# Set your DocSpace portal URL and API key
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'
GROUP_ID = '08e455dc-98c4-4390-b36f-54757080149c'  # Replace with your actual group ID

# Headers with API key
headers = {
  'Authorization': API_KEY
}

# Step 1: Get group by ID with members included
def get_group_with_members(group_id):
  url = f'{API_HOST}/api/2.0/group/{group_id}'
  params = {'includeMembers': True}

  response = requests.get(url, headers=headers, params=params)

  if response.status_code == 200:
    group = response.json().get('response', {})
    print(f'Group: {group.get('name')}')
    print('Members:')
    for m in group.get('members', []):
      print(f'- {m.get('id')} — {m.get('displayName')}')
  else:
    print(f"Group retrieval failed. Status code: {response.status_code}, Message: {response.text}")

# Run the method
if __name__ == '__main__':
  print('Getting group with members...')
  get_group_with_members(GROUP_ID)
