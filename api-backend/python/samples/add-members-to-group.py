import requests

# Set your DocSpace portal URL and API key
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with API key
headers = {
  'Authorization': API_KEY,
  'Content-Type': 'application/json'
}

# Step 1: Add members to a group (optionally rename and/or change manager)
def add_members_to_group(group_id, members, new_name=None, new_manager=None):
  url = f"{API_HOST}/api/2.0/group/{group_id}"
  data = {
      'membersToAdd': members
  }
  if new_name:
    data['groupName'] = new_name
  if new_manager:
    data['groupManager'] = new_manager

  response = requests.put(url, json=data, headers=headers)
  if response.status_code == 200:
    print(f"Members added to group {group_id}: {members}")
    if new_name:
      print(f"Group renamed to: {new_name}")
    if new_manager:
      print(f"New manager assigned: {new_manager}")
  else:
      print(f"Group update failed. Status code: {response.status_code}, Message: {response.text}")

# Run the method
if __name__ == '__main__':
add_members_to_group(
  'c652dba3-210e-436d-b264-df5ceda0a48e',  # Replace with your group ID
  ['d9be1cab-3ab4-4012-ad60-48218b2713dc', '4c65a238-ca50-4374-b904-0d51d4c1822b'],  # Member UUIDs
  new_name="Project Alpha Team",
  new_manager='c652dba3-210e-436d-b264-df5ceda0a48e'
)