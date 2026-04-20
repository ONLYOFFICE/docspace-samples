/*
Example: Start a backup manually

This example demonstrates how to start a backup in ONLYOFFICE DocSpace on demand via the API.
You can specify the target storage type and whether to include a full portal dump in the backup.

Using methods:
- POST /api/2.0/backup/startbackup (https://api.onlyoffice.com/docspace/api-backend/usage-api/start-backup/)
*/

// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authentication
const HEADERS = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};
function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}


async function startBackup() {
  // Backup payload: Local storage, full portal dump
  const payload = {
    storageType: 'Local', // Or "CustomCloud", "DataStore"
    dump: true,
  };

  // Send request to start backup
  const res = await fetchWithTimeout(`${API_HOST}/api/2.0/backup/startbackup`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  // Handle API response
  if (!res.ok) {
    const text = await res.text();
    console.log(`Backup start failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  const data = await res.json();
  const result = data?.response || {};
  console.log(`Backup task started. Progress: ${result.progress}%`);
  return result;
}

// Run
(async () => {
  await startBackup();
})();
