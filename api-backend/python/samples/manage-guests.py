'''
Example: Manage a guest user

This example demonstrates how to manage a guest user in ONLYOFFICE DocSpace using the API.

The script includes two main operations:

- Approving a guest who was invited via sharing.
- Deleting the guest by their unique ID.

Using methods:
- POST /api/2.0/people/guests/share/approve (https://api.onlyoffice.com/docspace/api-backend/usage-api/approve-guest-share-link/)
- DELETE /api/2.0/people/guests (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-guests/)
'''

import requests

# Set your DocSpace portal URL, access token, and guest email
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'
EMAIL = 'guest@example.com'

# Headers with authorization token
HEADERS = {
  'Authorization': API_KEY,
  'Content-Type': 'application/json'
}

# Step 1: Approve a guest invited via share
def approve_guest(email: str) -> str:
  url = f'{API_HOST}/api/2.0/people/guests/share/approve'
  resp = requests.post(url, headers=HEADERS, json={'email': email})

  print('Status Code:', resp.status_code)
  print('Raw Response:', resp.text)

  if resp.status_code == 200:
    guest = resp.json().get('response', {})
    print(f"Approved guest: {guest.get('displayName')} ({guest.get('email')})")
    return str(guest.get('id'))
  else:
    print(f"Guest approval failed. Status code: {resp.status_code}, Message: {resp.text}")
    return None

# Step 2: Delete a guest by ID
def delete_guest(user_id: str) -> None:
  url = f'{API_HOST}/api/2.0/people/guests'
  payload = {'userIds': [user_id], 'resendAll': False}
  resp = requests.delete(url, headers=HEADERS, json=payload)

  print('Status Code (delete):', resp.status_code)
  print('Raw Response (delete):', resp.text)

  if resp.status_code == 200:
    print(f'Guest with ID {user_id} deleted successfully.')
  else:
    print(f"Guest approval failed. Status code: {resp.status_code}, Message: {resp.text}")
    return None

# Run the guest management flow
if __name__ == '__main__':
  print('Approving guest...')
  guest_id = approve_guest(EMAIL)

  print('\nDeleting guest...')
  delete_guest(guest_id)
