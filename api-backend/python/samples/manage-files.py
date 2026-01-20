import requests
# Set API base URL
BASE_URL = 'https://yourportal.onlyoffice.com'
API_KEY = 'YOUR_API_KEY'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}',
  'Content-Type': 'application/json'
}

# Step 1: Create an empty file
def create_file(folder_id, file_name):
  url = f'{BASE_URL}/api/2.0/files/{folder_id}/file'
  data = {
    'title': file_name
  }
  requests.post(url, headers=HEADERS, json=data)
  if response.status_code == 200:
    print("File created successfully.")
    return response.json()
  else:
    print(f"File creation failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 2: Upload a file
def upload_file(folder_id, file_path):
  url = f'{BASE_URL}/api/2.0/files/{folder_id}/upload'
  headers = {
    'Authorization': f'Bearer {API_KEY}'
  }

  with open(file_path, 'rb') as file:
    files = {
      'file': (file_path, file, 'application/octet-stream')
    }
    response = requests.post(url, headers=headers, files=files)
    if response.status_code == 200:
      print("File uploaded successfully.")
      return response.json()
    else:
      print(f"File upload failed. Status code: {response.status_code}, Message: {response.text}")
      return None

# Step 3: Update an existing file
def update_file(file_id, new_file_path):
  url = f'{BASE_URL}/api/2.0/files/file/{file_id}'
  files = {'file': open(new_file_path, 'rb')}
  requests.put(url, headers=headers, files=files)
  if response.status_code == 200:
    print("File updated successfully.")
    return response.json()
  else:
    print(f"File update failed. Status code: {response.status_code}, Message: {response.text}")
    return None
  

# Step 4: Delete a file
def delete_file(file_id):
  url = f'{BASE_URL}.api/2.0/files/file/{file_id}'
  data = {
    'immediately': True
  }
  requests.delete(url, headers=headers, json=data)
  if response.status_code == 200:
    print("File deletion succeeded.")
    return response.json()
  else:
    print(f"File deletion failed. Status code: {response.status_code}, Message: {response.text}")
    return None

def main():
  folder_id = 776261 # Replace with actual folder ID
  file_name = 'NewDocument1.docx' # Replace with actual file name
  file_path = 'path/to/upload_file.txt' # Replace with actual file path
  updated_file_path = 'path/to/updated_file.txt' # Replace with actual updated file path
  file_id = 1187261 # Replace with actual file ID

  #Step 1
  create_file(folder_id, file_name)

  #Step 2
  upload_file(folder_id, file_path)

  #Step 3
  update_file(file_id, updated_file_path)

  #Step 4
  delete_file(file_id)
