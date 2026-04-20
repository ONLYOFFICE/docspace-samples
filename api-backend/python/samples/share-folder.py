'''
Example: Share a folder

This example demonstrates how to share a folder with a user by email (or by id) using the API.

Using methods:
- PUT /api/2.0/files/folder/{folderId}/share (https://api.onlyoffice.com/docspace/api-backend/usage-api/set-folder-security/)
'''

import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
}


def share_folder(folder_id, share, notify=False, sharing_message=''):
    url = f'{API_HOST}/api/2.0/files/folder/{folder_id}/share'
    data = {
        'share': share,
        'notify': notify
    }
    if sharing_message:
        data['sharingMessage'] = sharing_message

    response = requests.put(url, headers=HEADERS, json=data, timeout=30)
    if response.status_code == 200:
        return response.json()

    print(f"Folder share failed. Status code: {response.status_code}, Message: {response.text}")
    return None


if __name__ == "__main__":
    try:
        folder_id = '123456'  # Replace with your actual folder ID

        # For this folder share endpoint, use the `share` field with entries like { email, access } or { id, access }.
        share = [
            {'email': 'recipient@example.com', 'access': 'Read'},
            # {'id': '987654', 'access': 'ReadWrite'},
        ]

        result = share_folder(folder_id, share, notify=True, sharing_message='Folder shared via API.')
        print('Share folder result:', result)
    except Exception as err:
        print(err)
