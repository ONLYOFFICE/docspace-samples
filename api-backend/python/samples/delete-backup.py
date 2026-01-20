import requests

API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'

# Headers with authentication
HEADERS = {
  'Authorization': API_KEY
}

def delete_backup(backup_id: str):
  # Send DELETE request to remove the specified backup
  response = requests.delete(
    f'{API_HOST}/api/2.0/backup/deletebackup/{backup_id}',
    headers=HEADERS
  )

  if response.status_code == 200:
    result = response.json().get('response')
    print(f"Backup deleted: {result}")
    return result
  else:
    print(f"Backup deletion failed. Status code: {response.status_code}, Message: {response.text}")
    return None

if __name__ == '__main__':
  # Example: Replace with actual backup ID from backup history
  delete_backup('your-backup-id')
