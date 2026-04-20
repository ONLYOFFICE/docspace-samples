'''
Example: Start filling a form file

This example demonstrates how to start a form filling session for a file in ONLYOFFICE DocSpace.
Use a file ID for a compatible form/template file that supports fill mode.

Using methods:
- PUT /api/2.0/files/file/{fileId}/startfilling (https://api.onlyoffice.com/docspace/api-backend/usage-api/start-filling/)
'''

import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Accept': 'application/json',
}


def start_filling(file_id):
    url = f'{API_HOST}/api/2.0/files/file/{file_id}/startfilling'
    response = requests.put(url, headers=HEADERS, timeout=30)
    if response.status_code == 200:
        return response.json()

    print(f"Start filling failed. Status code: {response.status_code}, Message: {response.text}")
    return None


if __name__ == "__main__":
    try:
        file_id = '123456'  # Replace with your actual file ID
        result = start_filling(file_id)
        print('Start filling result:', result)
    except Exception as err:
        print(err)
