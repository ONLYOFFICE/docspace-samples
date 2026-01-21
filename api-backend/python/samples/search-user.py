'''
Example: Search users

This example demonstrates how to search for users in ONLYOFFICE DocSpace by a text query,
with optional filters for specific fields such as type, department, or role.

Using methods:
- GET /api/2.0/people/@search/{query} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-search/)
'''

import requests

# Set your DocSpace portal URL and access token
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

HEADERS = {'Authorization': API_KEY}

# Step 1: Search users by query and optional filters
def search_users(query, filter_by=None, filter_value=None):
  params = {}
  if filter_by and filter_value:
    params['filterBy'] = filter_by
    params['filterValue'] = filter_value

  response = requests.get(
    f'{API_HOST}/api/2.0/people/@search/{query}',
    headers=HEADERS,
    params=params
  )

  if response.status_code == 200:
    users = response.json().get('response', [])
    print(f"Found {len(users)} user(s) for query: '{query}'")
    for user in users:
      role = 'Visitor' if user.get('isVisitor') else 'User'
      print(f"- {user.get('displayName')} | {user.get('email')} | Role: {role}")
    return users
  else:
    print(f"User search failed. Status code: {response.status_code}, Message: {response.text}")
    return []

# Run examples
if __name__ == '__main__':
  search_users('john')
  search_users('guest', filter_by='type', filter_value='Visitor')
