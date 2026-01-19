// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authentication
const HEADERS = {
  Authorization: API_KEY,
};

async function deleteBackupHistory(dump) {
  const params = new URLSearchParams({ Dump: String(dump).toLowerCase() });
  const url = `${API_HOST}/api/2.0/backup/deletebackuphistory?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: HEADERS,
    });

    if (res.status !== 200) {
      const text = await res.text();
      console.log(`Backup history deletion failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    }

    const data = await res.json();
    const result = data?.response;

    console.log(`Backup history deleted: ${result}`);
    return result;
  } catch (err) {
    console.log(`Backup history deletion error: ${err.message}`);
    return null;
  }
}

// Example: Delete history without dump backups
deleteBackupHistory(false);
