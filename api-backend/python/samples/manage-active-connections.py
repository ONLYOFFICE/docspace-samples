'''

Example: Manage active portal connections

This example shows how to manage active user sessions in ONLYOFFICE DocSpace.
You can retrieve active sessions, log out all users except the current one, terminate a specific session, or revoke all sessions for a particular user.

Using methods:
- GET /api/2.0/security/activeconnections (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-all-active-connections/)
- PUT /api/2.0/security/activeconnections/logoutallexceptthis (https://api.onlyoffice.com/docspace/api-backend/usage-api/log-out-all-except-this-connection/)
- PUT /api/2.0/security/activeconnections/logout/{loginEventId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/log-out-active-connection/)
- PUT /api/2.0/security/activeconnections/logoutall/{userId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/log-out-all-active-connections-for-user/)
'''

import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}

# Step 1: Retrieve all active portal connections
def get_all_active_connections():
  url = f'{API_HOST}/api/2.0/security/activeconnections'
  response = requests.get(url, headers=HEADERS)

  if response.status_code == 200:
    active_connections = response.json()
    print(f"Active connections retrieved successfully: {active_connections}")
    return active_connections
  else:
    print(f"Active connections retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 2: Log out all sessions except the current one
def log_out_all_except_current():
  url = f'{API_HOST}/api/2.0/security/activeconnections/logoutallexceptthis'
  response = requests.put(url, headers=HEADERS)

  if response.status_code == 200:
    result = response.json()
    print(f"Logged out all connections except the current one: {result}")
    return result
  else:
    print(f"Logout-all-except-current failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 3: Log out a specific session by its login event ID
def log_out_active_connection(login_event_id):
  url = f'{API_HOST}/api/2.0/security/activeconnections/logout/{login_event_id}'
  response = requests.put(url, headers=HEADERS)

  if response.status_code == 200:
    result = response.json()
    print(f"Logged out connection {login_event_id}: {result}")
    return result
  else:
    print(f"Logout connection {login_event_id} failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 4: Log out all sessions for a specific user
def log_out_all_active_connections_for_user(user_id):
  url = f'{API_HOST}/api/2.0/security/activeconnections/logoutall/{user_id}'
  response = requests.put(url, headers=HEADERS)

  if response.status_code == 200:
    result = response.json()
    print(f"Logged out all connections for user {user_id}: {result}")
    return result
  else:
    print(f"Logout all for user {user_id} failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Example usage
if __name__ == '__main__':
  print("\nRetrieving all active connections:")
  active_data = get_all_active_connections()

  if not active_data:
    print("No active connections found.")
    exit()

  items = active_data.get('response', {}).get('items', [])
  if not items:
    print("Active connections list is empty.")
    exit()

  print("\nLogging out all connections except the current one:")
  log_out_all_except_current()

  first_connection_id = items[0].get('id')
  print(f"\nLogging out the connection with ID {first_connection_id}:")
  log_out_active_connection(first_connection_id)

  user_id = items[0].get('userId')
  print(f"\nLogging out all connections for user ID {user_id}:")
  log_out_all_active_connections_for_user(user_id)
