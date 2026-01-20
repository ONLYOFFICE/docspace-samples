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

# Step 1: Update IP restrictions settings
def save_restrictions(ip_restrictions, enable=True):
  url = f'{API_HOST}/api/2.0/settings/iprestrictions'
  data = {
    'enable': enable,
    'ipRestrictions': ip_restrictions
  }
  
  response = requests.put(url, json=data, headers=HEADERS)
  if response.status_code == 200:
    settings = response.json()
    print('IP restrictions updated successfully.')
    return settings
  else:
    print(f"IP restrictions update failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 2: Retrieve current IP restrictions settings
def get_restrictions():
  url = f'{API_HOST}/api/2.0/settings/iprestrictions'
  response = requests.get(url, headers=HEADERS)
  if response.status_code == 200:
    settings = response.json()
    print(f'IP restrictions settings retrieved: {settings}')
    return settings
  else:
    print(f"IP restrictions retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == "__main__":
  # Step 1: Update IP restrictions settings
  save_restrictions([
    { "ip": "192.168.1.1", "forAdmin": True }
  ])

  # Step 2: Retrieve current IP restrictions settings
  get_restrictions()
