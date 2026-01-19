import requests

# Set your DocSpace portal URL and token
API_HOST = 'https://yourportal.onlyoffice.com'
AUTH_TOKEN = 'your_access_token'

HEADERS = {'Authorization': AUTH_TOKEN}

# Step 1: Set Developer Tools access
def set_devtools_access(limited=True):
  url = f'{API_HOST}/api/2.0/settings/devtoolsaccess'
  payload = { 'limitedAccessForUsers': limited }

  response = requests.post(url, headers=HEADERS, json=payload)

  if response.status_code == 200:
    data = response.json().get('response', {})
    print('Developer Tools access settings updated:')
    print(f'• Limited for users: {data.get('limitedAccessForUsers')}')
    print(f'• Last Modified: {data.get('lastModified')}')
    return data
  else:
    print(f"Failed to update access settings. Status code: {response.status_code}, Message: {response.text}")
    return None

# Example usage
if __name__ == '__main__':
  print('Setting Developer Tools access...')
  set_devtools_access(limited=False)  # True = limit for users, False = allow full access
