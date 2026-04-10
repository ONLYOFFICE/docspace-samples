'''
Example: Share a file

This example demonstrates how to share a file with a user by email (or by id) using the API.

Using methods:
- PUT /api/2.0/files/file/{fileId}/share (https://api.onlyoffice.com/docspace/api-backend/usage-api/set-file-security/)
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


def share_file(file_id, share, notify=False, message=''):
    url = f'{API_HOST}/api/2.0/files/file/{file_id}/share'
    data = {
        'share': share,
        'notify': notify
    }
    if message:
        data['message'] = message

    response = requests.put(url, headers=HEADERS, json=data)
    if response.status_code == 200:
        return response.json()

    print(f"File share failed. Status code: {response.status_code}, Message: {response.text}")
    return None


if __name__ == "__main__":
    try:
        file_id = '123456'  # Replace with your actual file ID

        # For this file share endpoint, use the `share` field with entries like { email, access } or { id, access }.
        share = [
            {'email': 'recipient@example.com', 'access': 'Read'},
            # {'id': '987654', 'access': 'ReadWrite'},
        ]

        result = share_file(file_id, share, notify=True, message='You have access to the file.')
        print('Share file result:', result)
    except Exception as err:
        print(err)
