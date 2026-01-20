'''
Example: Enable custom filter mode for a file

This example demonstrates how to enable the Custom Filter mode for a specific file in ONLYOFFICE DocSpace using the API.
The Custom Filter feature allows you to restrict spreadsheet views so that users only see their own applied filters.

Using methods:
- PUT /api/2.0/files/file/{fileId}/customfilter (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-all-permissions/)
'''

import requests

# Set your DocSpace portal URL and access token
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'
FILE_ID = 123456  # Replace with your actual file ID

# Headers with authorization token
headers = {'Authorization': API_KEY}

# Step 1: Enable Custom Filter mode
def enable_custom_filter(file_id):
  payload = { 'enabled': True }
  response = requests.put(
    f'{API_HOST}/api/2.0/files/file/{file_id}/customfilter',
    headers=headers,
    json=payload
  )

  if response.status_code == 200:
    result = response.json().get('response', {})
    print(f'Custom Filter enabled for file ID {file_id}')
    print(f'• Title: {result.get('title')}')
    print(f'• View URL: {result.get('webUrl') or result.get('viewUrl')}')
    print(f'• Filter Enabled By: {result.get('customFilterEnabledBy')}')
  else:
    print(f"Custom Filter enabling failed. Status code: {response.status_code}, Message: {response.text}")

# Run the method
if __name__ == '__main__':
  print('Enabling Custom Filter mode...')
  enable_custom_filter(FILE_ID)
