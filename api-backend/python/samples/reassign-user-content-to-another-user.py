'''
Example: Reassign a user’s content to another user

This example demonstrates how to reassign a user’s data to another user in ONLYOFFICE DocSpace via the API:
check if reassignment is required, start the reassignment, monitor progress, and optionally terminate the task.

Using methods:
- GET /api/2.0/people/reassign/necessary (https://api.onlyoffice.com/docspace/api-backend/usage-api/necessary-reassign/)
- POST /api/2.0/people/reassign/start (https://api.onlyoffice.com/docspace/api-backend/usage-api/start-reassign/)
- GET /api/2.0/people/reassign/progress/{userId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-reassign-progress/)
- PUT /api/2.0/people/reassign/terminate (https://api.onlyoffice.com/docspace/api-backend/usage-api/terminate-reassign/)
'''

import requests
import time

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

HEADERS = {'Authorization': API_KEY}

# Step 1: Check if reassignment is necessary
def check_reassignment_needed(user_id, target_type='User'):
  params = {'UserId': user_id, 'Type': target_type}
  r = requests.get(f'{API_HOST}/api/2.0/people/reassign/necessary', headers=HEADERS, params=params)
  if r.status_code == 200:
    necessary = r.json().get('response', False)
    print(f"Reassignment required: {necessary}")
    return necessary
  else:
    print(f"Failed to check necessity. Status code: {r.status_code}, Message: {r.text}")
    return False

# Step 2: Start reassignment process
def start_reassignment(from_user_id, to_user_id, delete_profile=False):
  payload = {"fromUserId": from_user_id, "toUserId": to_user_id, "deleteProfile": delete_profile}
  r = requests.post(f'{API_HOST}/api/2.0/people/reassign/start', headers=HEADERS, json=payload)
  if r.status_code == 200:
    print("Reassignment started.")
  else:
    print(f"Failed to start reassignment. Status code: {r.status_code}, Message: {r.text}")

# Step 3: Monitor progress
def get_progress(user_id):
  while True:
    r = requests.get(f'{API_HOST}/api/2.0/people/reassign/progress/{user_id}', headers=HEADERS)
    if r.status_code == 200:
      data = r.json().get('response', {})
      print(f"Progress: {data.get('percentage')}%")
      if data.get('isCompleted'):
        print("Reassignment completed.")
        break
      time.sleep(2)
    else:
      print(f"Failed to fetch progress. Status code: {r.status_code}, Message: {r.text}")
      break

# Step 4: terminate the reassignment
def terminate_reassignment(user_id):
  payload = {'userId': user_id}
  r = requests.put(f'{API_HOST}/api/2.0/people/reassign/terminate', headers=HEADERS, json=payload)
  if r.status_code == 200:
    print("Reassignment terminated.")
  else:
    print(f"Failed to terminate reassignment. Status code: {r.status_code}, Message: {r.text}")

if __name__ == '__main__':
  from_user_id = 'SOURCE-USER-ID'
  to_user_id = 'TARGET-USER-ID'

  # Step 1: check necessity
  if check_reassignment_needed(from_user_id):
    # Step 2: start reassignment
    start_reassignment(from_user_id, to_user_id, delete_profile=True)
    # Step 3: track progress
    get_progress(from_user_id)
    # Step 4: terminate the reassignment
    terminate_reassignment(from_user_id)
