import requests

# Set API base URL
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key for authentication
HEADERS = {
'Accept': 'application/json',
'Authorization': f'Bearer {API_KEY}',
'Content-Type': 'application/json'
}

# Step 1: Create a new user
def create_user(first_name, last_name, email):
url = f'{API_HOST}/api/2.0/people'
data = {
  'firstName': first_name,
  'lastName': last_name,
  'email': email
}
response = requests.post(url, json=data, headers=HEADERS)
if response.status_code == 200:
  user_id = response.json()['response']['id']
  print(f'User created successfully: {user_id}')
  return user_id
else:
  print(f'Failed to create user. Status code: {response.status_code}, Message: {response.text}')
  return None

# Step 2: Retrieve a user by ID
def get_user(user_id):
url = f'{API_HOST}/api/2.0/people/{user_id}'
response = requests.get(url, headers=HEADERS)
if response.status_code == 200:
  user_data = response.json()
  print(f'User retrieved: {user_data}')
  return user_data
else:
  print(f'Failed to retrieve user. Status code: {response.status_code}, Message: {response.text}')
  return None

# Step 3: Terminate a user
def terminate_user(user_id):
url = f'{API_HOST}/api/2.0/people/status/Terminated'
data = {'userIds': [user_id], 'resendAll': False}
response = requests.put(url, json=data, headers=HEADERS)
if response.status_code == 200:
  print(f'User {user_id} terminated successfully')
else:
  print(f'Failed to terminate user. Status code: {response.status_code}, Message: {response.text}')

# Step 4: Delete user profile
def delete_user(user_id):
url = f'{API_HOST}/api/2.0/people/{user_id}'
response = requests.delete(url, headers=HEADERS)
if response.status_code == 200:
  print(f'User {user_id} deleted successfully')
else:
  print(f'Failed to delete user. Status code: {response.status_code}, Message: {response.text}')

if __name__ == "__main__":
# Step 1: Create a new user
user_id = create_user("John", "Doe", "john.doe@example.com")

if user_id:
  # Step 2: Retrieve user information
  get_user(user_id)

  # Step 3: Terminate the user
  terminate_user(user_id)

  # Step 4: Delete user profile
  delete_user(user_id)
