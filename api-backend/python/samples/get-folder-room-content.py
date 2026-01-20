'''
Example: Get folder and room contents

This example demonstrates how to retrieve the contents of a folder or room in ONLYOFFICE DocSpace. The same API endpoint returns both files and subfolders.

Using methods:
- GET /api/2.0/files/{folderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-folder-by-folder-id/)
'''

import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
headers = {
  'Authorization': f'Bearer {API_KEY}',
  'Accept': 'application/json'
}

# Step 1: Retrieve folder or room contents
def get_folder_contents(folder_id):
  url = f'{API_HOST}/api/2.0/files/:folderId'
  response = requests.get(url, headers=headers)

  print("Status Code:", response.status_code)
  print("Raw Response:", response.text)

  try:
    data = response.json()
    if isinstance(data, dict) and "response" in data:
      contents = data["response"]
      files = contents.get("files", [])
      folders = contents.get("folders", [])

      print(f'\nContents of Folder ID {folder_id}:')

      print('\nFiles:')
      for file in files:
        print(f"- {file.get('title', 'No Title')} ({file.get('fileExst', 'Unknown Extension')}) — {file.get('contentLength', 'Unknown Size')}")

      print('\nFolders:')
      for folder in folders:
        print(f"- {folder.get('title', 'No Title')}")

        return contents
    else:
      print("Unexpected response format:", data)
  except Exception as e:
    print(f"Error parsing JSON: {e}")
    print("Raw response:", response.text)

return None

if __name__ == '__main__':
  folder_id = 1074098  # Replace with actual folder or room ID
  get_folder_contents(folder_id)
