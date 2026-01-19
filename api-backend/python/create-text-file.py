import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}',
  'Content-Type': 'application/json'
}

# Step 1: Create a text file in a folder
def create_text_file(folder_id, title, content):
  url = f'{API_HOST}/api/2.0/files/{folder_id}/text'
  data = {
    'title': title,
    'content': content
  }

  response = requests.post(url, json=data, headers=HEADERS)

  if response.status_code == 200:
    file_info = response.json()
    print(f'File created successfully: {file_info}')
    return file_info
  else:
    print(f"File creation failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == "__main__":
  folder_id = '123456'  # Replace with your target folder ID
  title = 'ExampleFile.txt'  # Desired file name
  content = 'This is the content of the example text file.'  # File content

  print('\nCreating a text file with specified content:')
  create_text_file(folder_id, title, content)
