// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authentication
const HEADERS = {
  Authorization: API_KEY,
};

function getRestoreProgress(dump) {
  // Optional query parameter: whether the restore includes a DB dump
  const params = new URLSearchParams({ Dump: String(dump).toLowerCase() });
  const url = `${API_HOST}/api/2.0/backup/getrestoreprogress?${params.toString()}`;

  // Send GET request to check restore progress
  return fetch(url, { method: 'GET', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Restore progress retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      const progressInfo = data?.response || {};
      console.log(`Progress: ${progressInfo.progress}%`);
      console.log(`Completed: ${progressInfo.isCompleted}`);
      console.log(`Task type: ${progressInfo.backupProgressEnum}`);
      console.log(`Error: ${progressInfo.error}`);
      console.log(`Download link: ${progressInfo.link}`);
      console.log(`Tenant ID: ${progressInfo.tenantId}`);
      return progressInfo;
    })
    .catch((err) => {
      console.log(`Restore progress retrieval error: ${err.message}`);
      return null;
    });
}

// Run example: Check restore progress without dump parameter
getRestoreProgress(false);
