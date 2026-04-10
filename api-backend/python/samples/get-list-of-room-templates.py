'''
Example: Get a list of room templates

This example demonstrates how to retrieve the list of room templates available in ONLYOFFICE DocSpace using the API.
Templates are returned as folders from the Templates area, so the integration can display them in an external UI or select one for later room creation.

Using methods:
- GET /api/2.0/files/rooms?searchArea=Templates (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-rooms-folder/)
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


# Step 1: Get room templates list
def get_room_templates():
    url = f'{API_HOST}/api/2.0/files/rooms?searchArea=Templates'
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        return response.json()

    print(f"Templates request failed. Status code: {response.status_code}, Message: {response.text}")
    return None


if __name__ == "__main__":
    try:
        data = get_room_templates()
        templates = (data or {}).get('response', {}).get('folders', [])

        if not isinstance(templates, list) or not templates:
            print('Templates: []')
        else:
            print('Templates:')
            for template in templates:
                print(f"- ID: {template.get('id')}, Title: {template.get('title')}")
    except Exception as err:
        print(err)
