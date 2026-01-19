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

# Step 1: Create a new group
def create_group(group_name, manager_id, member_ids):
  url = f'{API_HOST}/api/2.0/group'
  data = {
    'groupName': group_name,
    'groupManager': manager_id,
    'members': member_ids
  }
  response = requests.post(url, json=data, headers=HEADERS)
  if response.status_code == 200:
    group_id = response.json()['response']['id']
    print('Group created successfully:', group_id)
    return group_id
  else:
    print(f"Group creation failed. Status code: {response.status_code}, Message: {response.text}")

# Step 2: Retrieve group by ID
def get_group_by_id(group_id):
  url = f'{API_HOST}/api/2.0/group/{group_id}'
  response = requests.get(url, headers=HEADERS)
  if response.status_code == 200:
    group = response.json()
    print(group)
    return group
  else:
    print(f"Group retrieval failed. Status code: {response.status_code}, Message: {response.text}")

# Step 3: Update an existing group
def update_group(group_id, new_group_name):
  url = f'{API_HOST}/api/2.0/group/{group_id}'
  data = {
    'groupName': new_group_name
  }
  response = requests.put(url, json=data, headers=HEADERS)
  if response.status_code == 200:
    group_id = response.json()['response']['id']
    print('Group updated successfully:', group_id)
    return group_id
  else:
    print(f"Group update failed. Status code: {response.status_code}, Message: {response.text}")

# Step 4: Delete a group
def delete_group(group_id):
  url = f'{API_HOST}/api/2.0/group/{group_id}'
  response = requests.delete(url, headers=HEADERS)
  if response.status_code == 200:
    print(f"Group {group_id} deleted successfully.")
  else:
    print(f"Group deletion failed. Status code: {response.status_code}, Message: {response.text}")


if __name__ == "__main__":
  group_name = "New Group" # Replace with actual group name
  manager_id = "10001"  # Replace with actual manager ID
  member_ids = ["10001", "10002"]  # Replace with actual member IDs
  # Step 1: Create a new group
  group_id = create_group(group_name, manager_id, member_ids)

  # Step 2: Retrieve group details by ID
  get_group_by_id(group_id)

  # Step 3: Update the newly created group
  update_group(group_id, "Updated Group Name")
  
  # Step 4: Delete the newly created group
  delete_group(group_id)
