'''
Example: Search users by extended filter

This example demonstrates how to retrieve a list of users in ONLYOFFICE DocSpace with optional extended filter parameters such as group ID,
employee type, administrator status, and result limit.

Using methods:
- GET /api/2.0/people/filter (https://api.onlyoffice.com/docspace/api-backend/usage-api/search-users-by-extended-filter/)
'''

import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

HEADERS = {
  'Authorization': API_KEY
}

# Step 1: Search users with extended filters
def filter_users(group_id=None, employee_type=None, is_admin=True, count=10):
  params = {
    'count': count
  }
  if group_id:
    params['groupId'] = group_id
  if employee_type:
    params['employeeType'] = employee_type
  if is_admin is not None:
    params['isAdministrator'] = str(is_admin).lower()

  response = requests.get(f'{API_HOST}/api/2.0/people/filter', headers=HEADERS, params=params)

  if response.status_code == 200:
    users = response.json().get('response', [])
    print(f'Found {len(users)} user(s) with filters:')
    for user in users:
      print(f'- {user.get('displayName')} | Dept: {user.get('department')} | Admin: {user.get('isAdmin')}')
    return users
  else:
    print(f"Users retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == '__main__':
  filter_users(
    group_id='e02a91ef-542f-11ee-8c99-0242ac120002',
    employee_type='User',
    is_admin=True,
    count=5
  )
