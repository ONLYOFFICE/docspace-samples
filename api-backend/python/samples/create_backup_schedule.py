import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authentication
HEADERS = {
  'Authorization': API_KEY,
  'Content-Type': 'application/json'
}

def create_backup_schedule():
  # Backup schedule payload: daily at 3 AM, keep last 7 backups
  payload = {
    "storageType": "CustomCloud",  # Or "Local", "DataStore"
    "cronParams": {
      "period": "EveryDay",
      "hour": 3,
      "day": 0
    },
    "backupsStored": 7,
    "dump": True  # Include full portal dump
  }

  # Send request to create backup schedule
  response = requests.post(
    f'{API_HOST}/api/2.0/backup/createbackupschedule',
    headers=HEADERS,
    json=payload
  )

  # Check response status
  if response.status_code == 200:
    print("Backup schedule created successfully.")
  else:
    print(f"Backup schedule creation failed. Status code: {response.status_code}, Message: {response.text}")

if __name__ == "__main__":
  create_backup_schedule()
