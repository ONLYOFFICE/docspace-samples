import requests

# Set your DocSpace portal URL and access token
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

HEADERS = {
  'Authorization': API_KEY
}

# Step 1: Search users by status with optional filters
def search_users_by_status(status='active', query=None, filter_by=None, filter_value=None):
  params = {}
  if query:
    params['query'] = query
  if filter_by:
    params['filterBy'] = filter_by
  if filter_value:
    params['filterValue'] = filter_value

  response = requests.get(
    f'{API_HOST}/api/2.0/people/status/{status}/search',
    headers=HEADERS,
    params=params
  )

  if response.status_code == 200:
    users = response.json().get('response', [])
    print(f'Found {len(users)} user(s) with status: {status}')
    for user in users:
      print(f'- {user.get('displayName')} | Email: {user.get('email')} | ID: {user.get('id')}')
    return users
  else:
    print(f"User search by status failed. Status code: {response.status_code}, Message: {response.text}")
    return []

# Example usage
if __name__ == '__main__':
  search_users_by_status(
    status='1',  # Active status code
    query='*',
    filter_by='department',
    filter_value='Sales'
  )
