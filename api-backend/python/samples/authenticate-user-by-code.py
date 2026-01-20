'''
Example: Authenticate a user by code (2FA)

This example shows how to authenticate in ONLYOFFICE DocSpace using a one-time code from an authenticator app (TOTP) via POST `/api/2.0/authentication/:code`.

Using methods:
- POST /api/2.0/authentication (https://api.onlyoffice.com/docspace/api-backend/usage-api/authenticate-me/)
- POST /api/2.0/authentication/:code (https://api.onlyoffice.com/docspace/api-backend/usage-api/authenticate-me-from-body-with-code/)
'''

import requests, sys

# Set API base URL
BASE_URL = 'https://yourportal.onlyoffice.com'

# Primary credentials (internal provider)
CREDENTIALS = {
  'userName': 'you@example.com',
  'password': 'your_password',
  'remember': True
}

s = requests.Session()

# Step 1: start authentication with login/password
def primary_auth():
  r = s.post(f'{BASE_URL}/api/2.0/authentication', json=CREDENTIALS, timeout=30)
  r.raise_for_status()
  data = (r.json() or {}).get('response', {})
  token = data.get('token')
  if token:
    print('Authenticated (no 2FA).')
    return token, data
  print('2FA required.')
  return None, data  # may include tfaKey/confirmUrl

# Step 2: confirm login with TOTP code
def confirm_with_code(code, meta):
  headers = {}
  tfa_key = meta.get('tfaKey') or s.cookies.get('asc_auth_key')
  if tfa_key:
    headers['asc_auth_key'] = tfa_key  # some builds require this header

    body = {
      'userName': CREDENTIALS['userName'],
      'password': CREDENTIALS['password'],
      'code': code,   # duplicate in body is allowed
      'session': True
    }
    r = s.post(f'{BASE_URL}/api/2.0/authentication/{code}',
      json=body, headers=headers, timeout=30)
    r.raise_for_status()
    return (r.json() or {}).get('response', {}).get('token')

# Run
if __name__ == '__main__':
  token, meta = primary_auth()
  if not token:
    code = input('Enter TOTP code: ').strip()
    token = confirm_with_code(code, meta) or sys.exit('Confirm failed')
  print('Token:', token)