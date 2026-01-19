// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authentication
const HEADERS = {
  Authorization: API_KEY,
};

function getBackupHistory() {
  // Optional: set Dump=True for DB-only backups
  const params = new URLSearchParams({ Dump: 'False' });
  const url = `${API_HOST}/api/2.0/backup/getbackuphistory?${params.toString()}`;

  // Send request to retrieve backup history
  return fetch(url, {
    method: 'GET',
    headers: HEADERS,
  })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Backup history retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      if (!data) return;
      const backups = data.response || [];
      backups.forEach((item) => {
        console.log(`Backup ID: ${item.id}`);
        console.log(`File: ${item.fileName}`);
        console.log(`Storage: ${item.storageType}`);
        console.log(`Created: ${item.createdOn}`);
        console.log(`Expires: ${item.expiresOn}\n`);
      });
    })
    .catch((err) => {
      console.log(`Failed to retrieve history: ${err.message}`);
    });
}

// Run
getBackupHistory();
