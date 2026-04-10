'''
Example: Upload a large file in chunks

This example demonstrates how to upload a file larger than 10 MB to ONLYOFFICE DocSpace using an upload session.
The file is split into ordered chunks, and each chunk is uploaded to the session location until the file is fully uploaded.

Using methods:
- POST /api/2.0/files/{folderId}/upload/create_session (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-upload-session/)
'''

import os
from datetime import datetime, timezone

import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Each chunk must be <= 10 MB and a multiple of 512 bytes
CHUNK_SIZE = 10 * 1024 * 1024

# Headers with API key for authentication
JSON_HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
}

AUTH_HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
}


# Step 1: Create an upload session
def create_upload_session(folder_id, file_name, file_size):
    url = f'{API_HOST}/api/2.0/files/{folder_id}/upload/create_session'
    body = {
        'CreateOn': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'FileName': file_name,
        'FileSize': file_size,
        'folderId': folder_id,
    }

    response = requests.post(url, json=body, headers=JSON_HEADERS)

    if response.status_code == 200:
        return response.json()

    print(f"Upload session creation failed. Status code: {response.status_code}, Message: {response.text}")
    return None


# Step 2: Upload file chunks in order
def upload_chunks(location, file_path, file_name):
    total_size = os.path.getsize(file_path)
    total_chunks = (total_size + CHUNK_SIZE - 1) // CHUNK_SIZE
    last_response = None

    with open(file_path, 'rb') as file:
        for chunk_index in range(total_chunks):
            chunk = file.read(CHUNK_SIZE)
            files = {
                'file': (file_name, chunk, 'application/octet-stream')
            }
            response = requests.post(
                location,
                files=files,
                headers=AUTH_HEADERS
            )

            if response.status_code not in (200, 201):
                print(
                    f"Chunk upload failed at part {chunk_index + 1}/{total_chunks}. "
                    f"Status code: {response.status_code}, Message: {response.text}"
                )
                return None

            last_response = response.json()
            print(f"Chunk {chunk_index + 1}/{total_chunks} uploaded")

    return last_response


def main():
    folder_id = 12345  # Replace with the target folder ID
    file_path = 'path/to/large-file.docx'  # Replace with the file path

    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    file_name = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)

    if file_size <= CHUNK_SIZE:
        print('This sample is intended for files larger than 10 MB.')
        return

    session = create_upload_session(folder_id, file_name, file_size)
    location = (session or {}).get('data', {}).get('location')

    if not location:
        print('Upload session location was not returned.')
        return

    result = upload_chunks(location, file_path, file_name)

    if result:
        print('Upload completed successfully.')
        print(result)


if __name__ == "__main__":
    try:
        main()
    except Exception as err:
        print(err)
