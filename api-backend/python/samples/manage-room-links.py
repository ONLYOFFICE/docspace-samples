import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}',
  'Content-Type': 'application/json'
}

# Step 1: Set a room access link
def set_room_link(room_id, access_level=2, expiration_date=None, internal=True, primary=False):
  url = f'{API_HOST}/api/2.0/files/rooms/{room_id}/links'
  data = {
    'access': access_level,
    'expirationDate': expiration_date,
    'internal': internal,
    'primary': primary
  }

  response = requests.put(url, headers=HEADERS, json=data)

  if response.status_code == 200:
    return response.json()
  else:
    print(f"Room link set failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 2: Retrieve all links for a room
def get_room_links(room_id):
  url = f'{API_HOST}/api/2.0/files/rooms/{room_id}/links'
  response = requests.get(url, headers=HEADERS)

  if response.status_code == 200:
    return response.json()
  else:
    print(f"Room links retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == "__main__":
  room_id = '123456'  # Replace with your actual room ID

  set_room_link(room_id, access_level=2, internal=True, primary=False)
  get_room_links(room_id)
