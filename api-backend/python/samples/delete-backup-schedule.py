'''
Example: Delete backup schedule

This example demonstrates how to delete the current portal’s backup schedule in ONLYOFFICE DocSpace using the API.

Using methods:
- DELETE /api/2.0/backup/deletebackupschedule (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-backup-schedule/)
'''

import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authentication
HEADERS = {
  'Authorization': API_KEY
}

def delete_backup_schedule(dump: bool | None = None):
  # Optional query parameter: Dump=True for dump-based schedules
  params = {}
  if dump is not None:
    params['Dump'] = dump

  response = requests.delete(
    f'{API_HOST}/api/2.0/backup/deletebackupschedule',
    headers=HEADERS,
    params=params
  )

  if response.status_code == 200:
    result = response.json().get('response')
    print(f"Backup schedule deleted: {result}")
    return result
  else:
    print(f"Backup schedule deletion failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == '__main__':
  # Delete backup schedule without specifying Dump
  delete_backup_schedule()
