'''
Example: Create and open a new file

This example demonstrates how to create a new file inside a specific folder in ONLYOFFICE DocSpace using the API. 
After creation, the file is automatically opened in the default web browser using the returned editor link.

Using methods:
- POST /api/2.0/files/{folderId}/file (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-file/)
'''

import requests
import webbrowser

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}',
  'Content-Type': 'application/json'
}

# Step 1: Create a new file in a folder and open it
def create_file(folder_id, file_title):
  url = f'{API_HOST}/api/2.0/files/{folder_id}/file'
  data = {
    'title': file_title,
    'type': 'text'
  }

  response = requests.post(url, json=data, headers=HEADERS)

  if response.status_code == 200:
    file_info = response.json().get('response', {})
    edit_url = file_info.get('webUrl')
    if edit_url:
      webbrowser.open(edit_url)  # Open document in default browser
    return file_info
  else:
    print(f"File creation failed. Status code: {response.status_code}, Message: {response.text}")
  return None

if __name__ == "__main__":
  folder_id = '123456'  # Replace with your actual folder ID
  file_title = 'NewDocument.docx'

  create_file(folder_id, file_title)
