/*
Example: Get backup schedule

This example demonstrates how to retrieve the current portal’s backup schedule in ONLYOFFICE DocSpace using the API.

Using methods:
- GET /api/2.0/backup/getbackuphistory (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-backup-schedule/)
*/

// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authentication
const HEADERS = {
  Authorization: API_KEY,
};

function getBackupSchedule(dump) {
  // Optional query parameter: Dump=True to request dump-based schedule info
  const params = new URLSearchParams();
  if (dump !== undefined && dump !== null) {
    params.set('Dump', dump ? 'True' : 'False');
  }

  const qs = params.toString();
  const url = `${API_HOST}/api/2.0/backup/getbackupschedule${qs ? `?${qs}` : ''}`;

  return fetch(url, {
    method: 'GET',
    headers: HEADERS,
  })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Backup schedule retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      const schedule = data?.response || {};
      console.log('Storage type:', schedule.storageType);
      console.log('Cron params:', schedule.cronParams); // period/hour/day
      console.log('Backups stored:', schedule.backupsStored);
      console.log('Last backup time:', schedule.lastBackupTime);
      console.log('Dump enabled:', schedule.dump);
      return schedule;
    })
    .catch((err) => {
      console.log(`Backup schedule retrieval error: ${err.message}`);
      return null;
    });
}

// Run (retrieve schedule without forcing the Dump query param)
getBackupSchedule();
