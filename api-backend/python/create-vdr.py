import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Authorization': f'Bearer {API_KEY}'
}

# Step 1: Create a Virtual Data Room with a text watermark
def create_vdr_room(room_title, room_description):
  url = f'{API_HOST}/api/2.0/files/rooms'
  data = {
    'title': room_title,
    'description': room_description,
    'roomType': 8,  # VDR room
    'watermark': {
      'enabled': True,
      'text': 'Confidential',
      'rotate': -45,
      'additions': 1  # Adds UserName
    }
  }

  response = requests.post(url, headers=HEADERS, json=data)

  if response.status_code == 200:
    return response.json()
  else:
    print(f"VDR room creation failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == "__main__":
  room_title = 'Secure VDR Room'
  room_description = 'A virtual room with a confidential watermark.'

  create_vdr_room(room_title, room_description)
