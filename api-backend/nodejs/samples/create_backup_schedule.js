/*
Example: Create a backup schedule

This example demonstrates how to create a daily backup schedule in ONLYOFFICE DocSpace using the API (e.g., run every day at 03:00, keep the last 7 backups, optionally include a full portal dump).

Using methods:
- POST /api/2.0/backup/createbackupschedule (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-backup-schedule/)
*/

const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

const HEADERS = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

async function createBackupSchedule() {
  const payload = {
    storageType: 'CustomCloud', // Or "Local", "DataStore"
    cronParams: {
      period: 'EveryDay',
      hour: 3,
      day: 0,
    },
    backupsStored: 7,
    dump: true,
  };

  try {
    const res = await fetch(`${API_HOST}/api/2.0/backup/createbackupschedule`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(payload),
    });

    if (res.status === 200) {
      console.log('Backup schedule created successfully.');
      return;
    }

    const text = await res.text();
    console.log(`Backup schedule creation failed. Status code: ${res.status}, Message: ${text}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

createBackupSchedule();
