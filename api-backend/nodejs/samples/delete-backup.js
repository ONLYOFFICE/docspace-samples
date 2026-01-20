// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authentication
const HEADERS = {
  Authorization: API_KEY,
};

async function deleteBackup(backupId) {
  const url = `${API_HOST}/api/2.0/backup/deletebackup/${backupId}`;

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: HEADERS,
    });

    if (res.status !== 200) {
      const text = await res.text();
      console.log(`Backup deletion failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    }

    const data = await res.json();
    const result = data?.response;

    console.log(`Backup deleted: ${result}`);
    return result;
  } catch (err) {
    console.error(err.message);
    return null;
  }
}

// Run example
deleteBackup('your-backup-id');
