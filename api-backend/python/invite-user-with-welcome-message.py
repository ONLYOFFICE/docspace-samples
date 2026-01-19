import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'YOUR_TOKEN'
HEADERS = {'Authorization': API_KEY}

# Step 1: Get invitation link for a specific employee type
def get_invite_link(employee_type='Guest'):
  url = f'{API_HOST}/api/2.0/portal/users/invite/{employee_type}'
  response = requests.get(url, headers=HEADERS)
  if response.status_code == 200:
    invite_url = response.json().get('response')
    print(f"Invite link for {employee_type}: {invite_url}")
    return invite_url
  print(f"Invite link retrieval failed. Status code: {response.status_code}, Message: {response.text}")
  return None

# Step 2: Check if the user is active
def check_user_status(user_id):
  url = f'{API_HOST}/api/2.0/portal/users/{user_id}'
  response = requests.get(url, headers=HEADERS)
  if response.status_code == 200:
    user = response.json().get('response', {})
    print("User Info:")
    print(f"• Name: {user.get('firstName')} {user.get('lastName')}")
    print(f"• Email: {user.get('email')}")
    print(f"• Active: {user.get('isActive')}")
    print(f"• Created: {user.get('createDate')}")
    return user
  print(f"User info retrieval failed. Status code: {response.status_code}, Message: {response.text}")
  return None

# Step 3: Send welcome message
def send_congratulations(user_id, key='welcome_guest'):
  url = f'{API_HOST}/api/2.0/portal/sendcongratulations'
  params = {'Userid': user_id, 'Key': key}
  response = requests.post(url, headers=HEADERS, params=params)
  if response.status_code == 200:
    print("Congratulations message sent successfully.")
  else:
    print(f"Congratulations send failed. Status code: {response.status_code}, Message: {response.text}")

if __name__ == '__main__':
  print("Step 1: Generate invitation link...")
  link = get_invite_link('Guest')  # Can also be: 'User', 'RoomAdmin', etc.

  # Simulate that user registers via this link...

  print("\nStep 2: Check user registration status...")
  test_user_id = 'REPLACE-WITH-REAL-USER-ID'
  user = check_user_status(test_user_id)

  if user.get('isActive'):
    print("\nStep 3: Send welcome message...")
    send_congratulations(test_user_id)
