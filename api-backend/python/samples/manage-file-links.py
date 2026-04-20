'''
Example: Manage file links

This example demonstrates how to create/update and retrieve external/public links for a file in ONLYOFFICE DocSpace.
It also shows how to extract a share token from the returned share link.

Using methods:
- PUT /api/2.0/files/file/{fileId}/links (https://api.onlyoffice.com/docspace/api-backend/usage-api/set-file-link/)
- GET /api/2.0/files/file/{fileId}/links (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-file-links/)
'''

import requests
from urllib.parse import urlparse, parse_qs

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
}


def unwrap_response(json_value):
    if isinstance(json_value, dict) and 'response' in json_value:
        return json_value.get('response')
    return json_value


def extract_share_token(share_link):
    if not share_link:
        return None
    try:
        parsed = urlparse(str(share_link))
        qs = parse_qs(parsed.query or "")
        if 'share' in qs and qs['share']:
            return qs['share'][0]
        parts = [p for p in (parsed.path or '').split('/') if p]
        if 's' in parts:
            i = parts.index('s')
            if i + 1 < len(parts):
                return parts[i + 1]
        return None
    except Exception:
        return None


def set_file_link(file_id, access='ReadWrite', title=None):
    url = f'{API_HOST}/api/2.0/files/file/{file_id}/links'
    data = {
        'access': access,
        'internal': False,
        'primary': True
    }
    if title:
        data['title'] = title

    response = requests.put(url, headers=HEADERS, json=data, timeout=30)
    if response.status_code == 200:
        return unwrap_response(response.json())

    print(f"File link set failed. Status code: {response.status_code}, Message: {response.text}")
    return None


def get_file_links(file_id):
    url = f'{API_HOST}/api/2.0/files/file/{file_id}/links'
    response = requests.get(url, headers=HEADERS, timeout=30)
    if response.status_code == 200:
        return unwrap_response(response.json())

    print(f"File links retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None


def pick_external_primary_link(links_value):
    items = []
    if isinstance(links_value, list):
        items = links_value
    elif isinstance(links_value, dict):
        maybe = links_value.get('links') or links_value.get('items')
        if isinstance(maybe, list):
            items = maybe
        else:
            items = [links_value]

    normalized = []
    for item in items:
        shared = {}
        if isinstance(item, dict):
            shared = item.get('sharedLink') or item.get('sharedTo') or {}
        normalized.append({
            'shareLink': (shared.get('shareLink') if isinstance(shared, dict) else None) or (item.get('shareLink') if isinstance(item, dict) else None),
            'requestToken': (shared.get('requestToken') if isinstance(shared, dict) else None) or (item.get('requestToken') if isinstance(item, dict) else None),
            'internal': item.get('internal') if isinstance(item, dict) else None,
            'primary': item.get('primary') if isinstance(item, dict) else None,
        })

    for entry in normalized:
        if entry.get('primary') and entry.get('internal') is False and entry.get('shareLink'):
            return entry
    for entry in normalized:
        if entry.get('internal') is False and entry.get('shareLink'):
            return entry
    for entry in normalized:
        if entry.get('shareLink'):
            return entry
    return None


if __name__ == "__main__":
    try:
        file_id = '123456'  # Replace with your actual file ID

        set_resp = set_file_link(file_id, access='ReadWrite', title='Public link (ReadWrite)')
        print('Link set response:', set_resp)

        links = get_file_links(file_id)
        print('Links:', links)

        picked = pick_external_primary_link(links) or pick_external_primary_link(set_resp)
        share_link = picked.get('shareLink') if picked else None
        request_token = (picked.get('requestToken') if picked else None) or extract_share_token(share_link)

        print('Picked shareLink:', share_link)
        print('Picked requestToken/shareToken:', request_token)
    except Exception as err:
        print(err)
