import requests

# Set your DocSpace portal URL and API key
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
  'Accept': 'application/json',
  'Authorization': f'Bearer {API_KEY}'
}

# Step 1: Move members from one group to another
def move_group_members(from_group_id, to_group_id):
  url = f'{API_HOST}/api/2.0/group/{from_group_id}/members/{to_group_id}'
  response = requests.put(url, headers=HEADERS)

  if response.status_code == 200:
    print(f'Members moved from group {from_group_id} to group {to_group_id}')
  else:
    print(f'Move members failed. Status code: {response.status_code}, Message: {response.text}')


if __name__ == '__main__':
  move_group_members(
    '08e455dc-98c4-4390-b36f-54757080149c',  # Replace with source group ID
    '258efd0c-b5b7-4bc9-87ab-e39b2c2eb09c'   # Replace with destination group ID
  )
