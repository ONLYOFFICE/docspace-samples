import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}'
}

# Step 1: Get "My Documents" contents
def get_my_documents():
  url = f'{API_HOST}/api/2.0/files/@my'
  response = requests.get(url, headers=HEADERS)

  if response.status_code == 200:
    return response.json()
  else:
    print(f"\"My Documents\" retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 2: Upload a file to "My Documents"
def upload_file_to_my(file_path):
  url = f'{API_HOST}/api/2.0/files/@my/upload'
  with open(file_path, 'rb') as file:
    files = {'file': (file_path, file)}
    response = requests.post(url, headers=HEADERS, files=files)

  if response.status_code == 200:
    return response.json()
  else:
    print(f"Upload to \"My Documents\" failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 3: Create an empty file in "My Documents"
def create_file_in_my(file_title):
  url = f'{API_HOST}/api/2.0/files/@my/file'
  data = {'title': file_title}
  response = requests.post(url, headers=HEADERS, json=data)

  if response.status_code == 200:
    return response.json()
  else:
    print(f"File creation in \"My Documents\" failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 4: Delete a file from "My Documents"
def delete_file(file_id, immediately=True, delete_after=False):
  url = f'{API_HOST}/api/2.0/files/file/{file_id}'
  data = {
    'immediately': immediately,
    'deleteAfter': delete_after
  }

  requests.delete(url, headers=HEADERS, json=data)
  if response.status_code == 200:
    print(f"File deletion from \"My Documents\" succeeded: {response.json()}")
  else:
    print(f"File deletion from \"My Documents\" failed. Status code: {response.status_code}, Message: {response.text}")

if __name__ == "__main__":
  get_my_documents()

  file_path = 'example.pdf'  # Replace with actual path to the file
  upload_file_to_my(file_path)

  file_title = 'NewDocument.docx'
  create_file_in_my(file_title)

  file_id = '123456'  # Replace with an actual file ID
  delete_file(file_id)
