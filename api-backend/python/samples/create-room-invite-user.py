'''
Example: Create a room and invite a user

This example demonstrates how to programmatically create a new room in ONLYOFFICE DocSpace and invite a user to it via email with specific access permissions.

Using methods:
- POST /api/2.0/files/rooms (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-room/)
- PUT /api/2.0/files/rooms/{roomId}/share (https://api.onlyoffice.com/docspace/api-backend/usage-api/set-room-security/)
'''

import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
'Authorization': f'Bearer {API_KEY}',
'Content-Type': 'application/json'
}

# Step 1: Create a new room
def create_room(title):
url = f'{API_HOST}/api/2.0/files/rooms'
data = {
  'title': title,
  'roomType': 2  # Type 2 = collaboration room
}

response = requests.post(url, json=data, headers=HEADERS)

if response.status_code == 200:
  room_id = response.json()['response']['id']
  return room_id
else:
  print(f"Room creation failed. Status code: {response.status_code}, Message: {response.text}")
return None

# Step 2: Invite a user to the room
def invite_user_to_room(room_id, email, access='ReadWrite'):
url = f'{API_HOST}/api/2.0/files/rooms/{room_id}/share'
data = {
  'invitations': [
    {
      'email': email,
      'access': access
    }
  ],
  'notify': True,
  'message': 'You have been invited to a room'
}

requests.put(url, json=data, headers=HEADERS)
if response.status_code == 200:
  print(f"User {email} invited to room {room_id} with access {access}")
else:
  print(f"Invitation failed. Status code: {response.status_code}, Message: {response.text}")

if __name__ == "__main__":
room_title = 'Project Collaboration'
user_email = 'example.user@mail.com'
user_access = 'Editing'

room_id = create_room(room_title)

if room_id:
  invite_user_to_room(room_id, user_email, user_access)
