'''
Example: Update group manager

This example demonstrates how to update group manager in ONLYOFFICE DocSpace.

Using methods:
- POST /api/2.0/group (https://api.onlyoffice.com/docspace/api-backend/usage-api/add-group/)
- PUT /api/2.0/group/{groupId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-group/)
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

# Step 1: Create a new group and add members
def create_group(group_name, manager_id, member_ids):
  url = f'{API_HOST}/api/2.0/group'
  data = {
    'groupName': group_name,
    'groupManager': manager_id,
    'members': member_ids
  }
  response = requests.post(url, json=data, headers=HEADERS)
  if response.status_code == 200:
    group_id = response.json()['response']['id']
    print('Group created successfully:', group_id)
    return group_id
  else:
    print(f"Group creation failed. Status code: {response.status_code}, Message: {response.text}")

# Step 2: Reassign group ownership
def reassign_group_manager(group_id, new_manager_id):
  url = f'{API_HOST}/api/2.0/group/{group_id}'
  data = {'groupManager': new_manager_id}
  response = requests.put(url, json=data, headers=HEADERS)
  if response.status_code == 200:
    print(f'Group {group_id} manager reassigned successfully to {new_manager_id}')
  else:
    print(f"Group manager reassignment failed. Status code: {response.status_code}, Message: {response.text}")
  
if __name__ == "__main__":
  manager_user_id = "10001"
  user_id = "10002"

  # Step 1: Create a new group
  group_id = create_group("Development Team", manager_user_id, [manager_user_id, user_id])

  if group_id:
    # Step 2: Reassign group ownership to user
    reassign_group_manager(group_id, user_id)
