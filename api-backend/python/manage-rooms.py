import requests

# Set API base URL
BASE_URL = 'https://yourportal.onlyoffice.com'
API_KEY = 'YOUR_API_KEY'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}',
  'Content-Type': 'application/json'
}

# Step 1: Create a room
def create_room(room_name, description):
  url = f'{BASE_URL}/api/2.0/files/room'
  data = {
    'title': room_name,
    'description': description
  }
  if response.status_code == 200:
    room_id = response.json()['response']['id']
    print(f'Room created successfully: {room_id}')
    return room_id
  else:
    print(f'Failed to create room: {response.status_code} - {response.text}')
    return None

# Step 2: Retrieve room details
def get_room_details(room_id):
  url = f'{BASE_URL}/api/2.0/files/room/{room_id}'
  response = requests.get(url, headers=headers)
  room_info = response.json()
  if response.status_code == 200:
    room_info = response.json()
    print(f'Room details: {room_info}')
    return room_info
  else:
    print(f'Failed to get room details: {response.status_code} - {response.text}')
    return None

# Step 3: Rename a room
def rename_room(room_id, new_name):
  url = f'{BASE_URL}/api/2.0/files/room/{room_id}/rename'
  data = {
    'title': new_name
  }
  requests.put(url, headers=headers, json=data)
  if response.status_code == 200:
    print(f'Room {room_id} renamed successfully.')
  else:
    print(f'Failed to rename room: {response.status_code} - {response.text}')

# Step 4: Archive a room
def archive_room(room_id):
  url = f'{BASE_URL}/api/2.0/files/room/{room_id}/archive'
  requests.put(url, headers=headers)
  if response.status_code == 200:
    print(f'Room {room_id} archived successfully.')
  else:
    print(f'Failed to archive room: {response.status_code} - {response.text}')

# Step 5: Delete a room
def delete_room(room_id):
  url = f'{BASE_URL}/api/2.0/files/room/{room_id}'
  requests.delete(url, headers=headers)
  if response.status_code == 200:
    print(f'Room {room_id} deleted successfully.')
  else:
    print(f'Failed to delete room: {response.status_code} - {response.text}')

def main():
  room_name = 'New Room' # Replace with actual room name
  description = 'This is a test room.' # Replace with actual room description
  new_room_name = 'Updated Room Name' # Replace with actual new room name
  room_id = 1234 # Replace with actual room ID

#Step 1
create_room(room_name, description)

#Step 2
get_room_details(room_id)

#Step 3
rename_room(room_id, new_room_name)

#Step 4
archive_room(room_id)

#Step 5
delete_room(room_id)
