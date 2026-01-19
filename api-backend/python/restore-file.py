import requests

# Set API base URL
API_HOST = "https://yourportal.onlyoffice.com"
API_KEY = "your_api_key"

# Headers with API key for authentication
HEADERS = {
  "Authorization": f"Bearer {API_KEY}"
}

# Step 1: Get file version history
def get_file_versions(file_id):
  url = f"{API_HOST}/api/2.0/files/file/{file_id}/edit/history"
  response = requests.get(url, headers=HEADERS)
  
  if response.status_code == 200:
    data = response.json()
    versions = data.get("response", [])
    print("Available versions:")
    for v in versions:
        print(f"- Version {v['version']} created at {v['created']}")
    return versions
  else:
    print(f"File versions retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return []

# Step 2: Restore file to specific version
def restore_file_version(file_id, version_number):
  url = f"{API_HOST}/api/2.0/files/file/{file_id}/restoreversion"
  params = { "version": version_number }
  response = requests.get(url, headers=HEADERS, params=params)

  if response.status_code == 200:
    print(f"File restored to version {version_number}")
  else:
    print(f"Restore to version {version_number} failed. Status code: {response.status_code}, Message: {response.text}")

# Run the flow
if __name__ == "__main__":
  file_id = 1569862  # Replace with your file ID
  versions = get_file_versions(file_id)

  if versions and len(versions) > 1:
    target_version = versions[0]["version"]
    restore_file_version(file_id, target_version)
  else:
    print("No previous versions available for restore.")
