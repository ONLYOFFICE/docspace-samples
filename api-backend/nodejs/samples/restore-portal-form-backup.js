/*
Example: Restore portal from a backup

This example demonstrates how to restore an ONLYOFFICE DocSpace portal from a specific backup using the API.
You can specify the backup ID, storage type, and optional parameters such as user notifications and dump usage.

Using methods:
- POST /backup/startrestore (https://api.onlyoffice.com/docspace/api-backend/usage-api/start-backup-restore/)
*/

// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authentication
const HEADERS = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

async function restorePortal() {
  // Restore payload: specify backup ID, storage type, and options
  const payload = {
    backupId: 'your-backup-id', // Obtained from GET /backup/getbackuphistory
    storageType: 'Local',       // Or "CustomCloud", "DataStore"
    notify: true,               // Send notifications to users
    dump: true,                 // Use dump if required
  };

  // Send request to start restoration
  const res = await fetch(`${API_HOST}/api/2.0/backup/startrestore`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  // Handle API response
  if (!res.ok) {
    const text = await res.text();
    console.log(`Restore start failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  const data = await res.json();
  const result = data?.response || {};
  console.log(`Restoration started. Progress: ${result.progress}%`);
  return result;
}

// Run
(async () => {
  await restorePortal();
})();
