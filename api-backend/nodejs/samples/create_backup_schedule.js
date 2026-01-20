const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authentication
const HEADERS = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

function createBackupSchedule() {
  // Backup schedule payload: daily at 3 AM, keep last 7 backups
  const payload = {
    storageType: 'CustomCloud', // Or "Local", "DataStore"
    cronParams: {
      period: 'EveryDay',
      hour: 3,
      day: 0,
    },
    backupsStored: 7,
    dump: true, // Include full portal dump
  };

  return fetch(`${API_HOST}/api/2.0/backup/createbackupschedule`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (res.status === 200) {
        console.log('Backup schedule created successfully.');
      } else {
        return res.text().then((t) => {
          const text = await res.text();
          console.log(`Backup schedule creation failed. Status code: ${res.status}, Message: ${text}`);
        });
      }
    })
    .catch((err) => {
      console.log(`Error: ${err.message}`);
    });
}

// Run
createBackupSchedule();