'''
Example: Retrieve user login audit events

This example demonstrates how to retrieve user login audit activities in ONLYOFFICE DocSpace.
You can either fetch the most recent login records or apply filters such as user ID, action type, and time period.

Using methods:
- GET /api/2.0/security/audit/login/last (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-last-login-events/)
- GET /api/2.0/security/audit/login/filter (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-login-events-by-filter/)
'''

import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}',
  'Content-Type': 'application/json'
}

# Step 1: Retrieve the most recent login audit events
def get_last_login_events():
  url = f'{API_HOST}/api/2.0/security/audit/login/last'
  response = requests.get(url, headers=HEADERS)

  if response.status_code == 200:
    login_events = response.json()
    print(f"Last login events retrieved successfully: {login_events}")
    return login_events
  else:
    print(f"Login events retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 2: Retrieve login events using filters
def get_login_events_by_filter(user_id=None, action=None, start_date=None, end_date=None):
  url = f'{API_HOST}/api/2.0/security/audit/login/filter'
  params = {
    'userId': user_id,
    'action': action,
    'from': start_date,
    'to': end_date
  }
  params = {k: v for k, v in params.items() if v is not None}

  response = requests.get(url, headers=HEADERS, params=params)

  if response.status_code == 200:
    filtered_events = response.json()
    print(f"Filtered login events retrieved successfully: {filtered_events}")
    return filtered_events
  else:
    print(f"Filtered login events retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Example usage
if __name__ == '__main__':
  print("\nRetrieving the most recent login events:")
  get_last_login_events()

  user_id = 'user_id_here'  # Replace with actual user ID
  action = 0  # 0 = login, 1 = logout
  start_date = '2025-01-01'
  end_date = '2025-12-31'

  print(f"\nRetrieving login events for user ID {user_id} from {start_date} to {end_date}:")
  get_login_events_by_filter(user_id=user_id, action=action, start_date=start_date, end_date=end_date)
