'''
Example: Update user role

This example demonstrates how to automate user onboarding in ONLYOFFICE DocSpace using the API.
It covers creating a user, retrieving their profile, and updating their role.

Using methods:
- POST /api/2.0/people (https://api.onlyoffice.com/docspace/api-backend/usage-api/add-member/)
- GET /api/2.0/people/{userId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-profile-by-user-id/)
- PUT /api/2.0/people/{userId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-member/)
'''

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
    print(f"User creation failed. Status code: {response.status_code}, Message: {response.text}")
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
    print(f"User retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

# Step 3: Update user role
def update_user_role(user_id, role):
  url = f'{API_HOST}/api/2.0/people/{user_id}'
  data = {'role': role}
  response = requests.put(url, json=data, headers=HEADERS)
  if response.status_code == 200:
    print(f'User {user_id} role updated to {role}')
  else:
    print(f"User role update failed. Status code: {response.status_code}, Message: {response.text}")

if __name__ == "__main__":
  # Step 1: Create a new user
  user_id = create_user("John", "Doe", "john.doe@example.com")

  if user_id:
    # Step 2: Retrieve user information
    get_user(user_id)

    # Step 3: Update user role
    update_user_role(user_id, "Manager")
