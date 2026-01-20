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

# Step 1: Create users with emails and return user data
def create_users(users):
  created_users = []
  for user in users:
    url = f'{API_HOST}/api/2.0/people'
    data = {
      'firstName': user['first_name'],
      'lastName': user['last_name'],
      'email': user['email']
    }
    response = requests.post(url, json=data, headers=HEADERS)
    if response.status_code == 200:
      user_data = response.json()['response']
      print(f'User created successfully: {user_data}')
      created_users.append(user_data)
    else:
      print(f'User creation failed for {user["email"]}. Status code: {response.status_code}, Message: {response.text}')
  return created_users

# Step 2: Send invitations to newly created users
def send_invitations(users):
  url = f'{API_HOST}/api/2.0/people/invite'
  data = {
    "invitations": [{"email": user["email"], "type": "All"} for user in users]
  }
  response = requests.post(url, json=data, headers=HEADERS)
  if response.status_code == 200:
    print(f'Invitations sent successfully to users.')
  else:
    print(f'Invitations send failed. Status code: {response.status_code}, Message: {response.text}')

if __name__ == "__main__":
  # List of users to create
  users = [
    # Enter your email for testing
    {"first_name": "Alice", "last_name": "Smith", "email": "alice.smith@example.com"},
    {"first_name": "Bob", "last_name": "Johnson", "email": "bob.johnson@example.com"}
  ]
  
  # Step 1: Create new users and get their data
  created_users = create_users(users)
  
  # Step 2: Send invitations to newly created users
  if created_users:
    send_invitations(created_users)
