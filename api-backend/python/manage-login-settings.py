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

# Step 1: Update login settings
def update_login_settings(attemptCount, blockTime, checkPeriod):
  url = f'{API_HOST}/api/2.0/settings/security/loginsettings'
  data = {
    'attemptCount': attemptCount,
    'blockTime': blockTime,
    'checkPeriod': checkPeriod
  }
  response = requests.put(url, json=data, headers=HEADERS)
  if response.status_code == 200:
    print('Login settings updated successfully.')
  else:
    print(f"Login settings update failed. Status code: {response.status_code}, Message: {response.text}")

# Step 2: Retrieve current login settings
def get_login_settings():
  url = f'{API_HOST}/api/2.0/settings/security/loginsettings'
  response = requests.get(url, headers=HEADERS)
  if response.status_code == 200:
    settings = response.json()
    print(f'Login settings retrieved: {settings}')
    return settings
  else:
    print(f"Login settings retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 3: Reset login settings to default
def reset_login_settings():
  url = f'{API_HOST}/api/2.0/settings/security/loginsettings'
  response = requests.delete(url, headers=HEADERS)
  if response.status_code == 200:
    print('Login settings reset to default successfully.')
  else:
    print(f"Login settings reset failed. Status code: {response.status_code}, Message: {response.text}")

if __name__ == "__main__":
  # Step 1: Update login settings
  update_login_settings(attemptCount=10, blockTime=30, checkPeriod=100)
  
  # Step 2: Retrieve current login settings
  get_login_settings() # Verify that the settings have been updated

  # Step 3: Reset login settings to default
  reset_login_settings()
  get_login_settings() # Verify that the settings have been reset
