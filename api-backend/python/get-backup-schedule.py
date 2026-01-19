import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authentication
HEADERS = {
  'Authorization': API_KEY
}

def get_backup_schedule(dump: bool | None = None):
  # Optional query parameter: Dump=True to request dump-based schedule info
  params = {}
  if dump is not None:
    params['Dump'] = dump

  response = requests.get(
    f'{API_HOST}/api/2.0/backup/getbackupschedule',
    headers=HEADERS,
    params=params
  )

  if response.status_code == 200:
    schedule = response.json().get('response', {})
    print("Storage type:", schedule.get('storageType'))
    print("Cron params:", schedule.get('cronParams'))       # period/hour/day
    print("Backups stored:", schedule.get('backupsStored'))
    print("Last backup time:", schedule.get('lastBackupTime'))
    print("Dump enabled:", schedule.get('dump'))
    return schedule
  else:
    print(f"Backup schedule retrieval failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == '__main__':
  # Retrieve schedule (without forcing the Dump query param)
  get_backup_schedule()
