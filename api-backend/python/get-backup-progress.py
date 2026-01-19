import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authentication
HEADERS = {
  'Authorization': API_KEY
}

def get_backup_progress():
  # Optional parameter for dump-based backup
  params = {'Dump': True}

  # Send request to retrieve progress
  response = requests.get(
      f'{API_HOST}/api/2.0/backup/getbackupprogress',
      headers=HEADERS,
      params=params
  )

  # Handle response
  if response.status_code == 200:
    data = response.json().get('response', {})
    print(f"Progress: {data.get('progress')}%")
    print(f"Completed: {data.get('isCompleted')}")
    print(f"Type: {data.get('backupProgressEnum')}")
    print(f"Download Link: {data.get('link')}")
  else:
    print(f"Backup progress retrieval failed. Status code: {response.status_code}, Message: {response.text}")

if __name__ == "__main__":
  get_backup_progress()
