/*
Example: Get backup progress

This example demonstrates how to check the progress of a backup process in ONLYOFFICE DocSpace using the API.
The response includes information such as completion status, backup type, and download link if available.

Using methods:
- GET /api/2.0/backup/getbackupprogress (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-backup-progress/)
*/

// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authentication
const HEADERS = {
  Authorization: API_KEY,
};

function getBackupProgress() {
  // Optional parameter for dump-based backup
  const params = new URLSearchParams({ Dump: 'True' });
  const url = `${API_HOST}/api/2.0/backup/getbackupprogress?${params.toString()}`;

  // Send request to retrieve progress
  return fetch(url, {
    method: 'GET',
    headers: HEADERS,
  })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Backup progress retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      if (!data) return;
      const resp = data.response || {};
      console.log(`Progress: ${resp.progress}%`);
      console.log(`Completed: ${resp.isCompleted}`);
      console.log(`Type: ${resp.backupProgressEnum}`);
      console.log(`Download Link: ${resp.link}`);
    })
    .catch((err) => {
      console.log(`Backup progress retrieval error: ${err.message}`);
    });
}

// Run
getBackupProgress();
