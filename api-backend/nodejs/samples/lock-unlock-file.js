/*
Example: Lock and unlock a file

This example demonstrates how to lock or unlock the specified file in ONLYOFFICE DocSpace and get a list of users and their access levels for the file.

Using methods:
- PUT /api/2.0/files/file/{fileId}/lock (https://api.onlyoffice.com/docspace/api-backend/usage-api/lock-file/)
- GET /api/2.0/files/file/{fileId}/protectusers (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-protected-file-users/)
*/

// Set API base URL
const API_HOST = 'yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Lock a file by ID
function lockFile(fileId) {
  const url = `https://${API_HOST}/api/2.0/files/file/${fileId}/lock`;
  const data = { lockFile: true };

  return fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`File lock failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`File lock error: ${err.message}`);
      return null;
    });
}

// Step 2: Unlock a file by ID
function unlockFile(fileId) {
  const url = `https://${API_HOST}/api/2.0/files/file/${fileId}/lock`;
  const data = { lockFile: false };

  return fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`File unlock failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`File unlock error: ${err.message}`);
      return null;
    });
}

// Step 3: View users with access to the file
function getProtectedFileUsers(fileId) {
  const url = `https://${API_HOST}/api/2.0/files/file/${fileId}/protectusers`;
  return fetch(url, {
    method: 'GET',
    headers: HEADERS,
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Protected file users retrieval failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`Protected file users retrieval error: ${err.message}`);
      return null;
    });
}

// Run
const file_id = '123456'; // Replace with a valid file ID

lockFile(file_id)
  .then(() => unlockFile(file_id))
  .then(() => getProtectedFileUsers(file_id));
