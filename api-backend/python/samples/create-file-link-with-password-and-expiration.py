'''
Example: Create a file link with password and expiration

This example demonstrates how to create or update a primary external link for a file in ONLYOFFICE DocSpace,
protect it with a password, and set an expiration date.

Using methods:
- PUT /api/2.0/files/file/{id}/links (https://api.onlyoffice.com/docspace/api-backend/usage-api/set-file-external-link/)
'''

from datetime import datetime, timedelta, timezone

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


def unwrap_response(data):
    if isinstance(data, dict) and 'response' in data:
        return data['response']
    return data


def pick_share_link(data):
    candidate = {}

    if isinstance(data, dict):
        candidate = data.get('sharedLink') or data.get('response', {}).get('sharedLink') or data

    return {
        'shareLink': candidate.get('shareLink') if isinstance(candidate, dict) else None,
        'requestToken': candidate.get('requestToken') if isinstance(candidate, dict) else None,
        'expirationDate': candidate.get('expirationDate') if isinstance(candidate, dict) else None,
        'password': candidate.get('password') if isinstance(candidate, dict) else None,
    }


# Step 1: Create or update the external link
def set_external_link(file_id, password, expires_at):
    url = f'{API_HOST}/api/2.0/files/file/{file_id}/links'
    body = {
        'access': 'Read',
        'internal': False,
        'primary': True,
        'title': 'Public link with password and expiration',
        'password': password,
        'expirationDate': {
            'utcTime': expires_at,
        },
    }

    response = requests.put(url, json=body, headers=HEADERS, timeout=30)

    if response.status_code == 200:
        return unwrap_response(response.json())

    print(f"External link creation failed. Status code: {response.status_code}, Message: {response.text}")
    return None


if __name__ == "__main__":
    try:
        file_id = 123456  # Replace with the actual file ID
        password = 'StrongPass123!'
        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat().replace('+00:00', 'Z')

        result = set_external_link(file_id, password, expires_at)

        if result:
            link_data = pick_share_link(result)
            token = link_data['requestToken'] or ''
            masked_token = f"{token[:6]}..." if token else "(none)"
            print('External link created or updated successfully.')
            print(f"Share link: {link_data['shareLink']}")
            print(f"Request token: {masked_token}")
            print(f"Expiration date: {link_data['expirationDate']}")
            # Password is not logged to avoid leaking it into CI logs or shell history.
    except Exception as err:
        print(err)
