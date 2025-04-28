import requests

# Set API base URL
BASE_URL = 'https://yourportal.onlyoffice.com'
API_KEY = 'YOUR_API_KEY'

# Headers with API key for authentication
HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Step 1: Create a Room
def create_room(room_name, description):
    url = f'{BASE_URL}/api/2.0/files/room'
    data = {
        'title': room_name,
        'description': description
    }
    requests.post(url, headers=HEADERS, json=data)

# Step 2: Retrieve Room Details
def get_room_details(room_id):
    url = f'{BASE_URL}/api/2.0/files/room/{room_id}'
    response = requests.get(url, headers=HEADERS)
    room_info = response.json()
    return room_info

# Step 3: Rename a Room
def rename_room(room_id, new_name):
    url = f'{BASE_URL}/api/2.0/files/room/{room_id}/rename'
    data = {
        'title': new_name
    }
    requests.put(url, headers=HEADERS, json=data)

# Step 4: Archive a Room
def archive_room(room_id):
    url = f'{BASE_URL}/api/2.0/files/room/{room_id}/archive'
    requests.put(url, headers=HEADERS)

# Step 5: Delete a Room
def delete_room(room_id):
    url = f'{BASE_URL}/api/2.0/files/room/{room_id}'
    requests.delete(url, headers=HEADERS)

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