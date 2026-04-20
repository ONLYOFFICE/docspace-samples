/*
Example: Manage the Trash section

This example demonstrates how to retrieve, restore, and empty the contents of the Trash section in ONLYOFFICE DocSpace using the API.

Using methods:
- GET /api/2.0/files/@trash (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-trash-folder/)
- PUT /api/2.0/files/fileops/emptytrash (https://api.onlyoffice.com/docspace/api-backend/usage-api/empty-trash/)
- PUT /api/2.0/files/fileops/move (https://api.onlyoffice.com/docspace/api-backend/usage-api/move-batch-items/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Get contents of the Trash section
function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function getTrashSection() {
  const url = `${API_HOST}/api/2.0/files/@trash`;
  const res = await fetchWithTimeout(url, { method: 'GET', headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Failed to get Trash: ${res.status} - ${text}`);
    return null;
  }
  return res.json();
}

// Step 2: Empty the Trash section
async function emptyTrash() {
  const url = `${API_HOST}/api/2.0/files/fileops/emptytrash`;
  const res = await fetchWithTimeout(url, { method: 'PUT', headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Failed to empty Trash: ${res.status} - ${text}`);
    return false;
  }

  console.log('Trash emptied successfully.');
  return true;
}

// Step 3: Restore a file from Trash to a specific folder
async function restoreFile(fileId, destFolderId) {
  const url = `${API_HOST}/api/2.0/files/fileops/move`;
  const body = JSON.stringify({
    fileIds: [fileId],
    destFolderId: destFolderId,
    deleteAfter: true,
    content: true,
  });

  const res = await fetchWithTimeout(url, { method: 'PUT', headers: HEADERS, body });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Failed to restore file ${fileId}: ${res.status} - ${text}`);
    return false;
  }

  console.log(`File ${fileId} restored to folder ${destFolderId}.`);
  return true;
}

// Run
(async () => {
  await getTrashSection();

  const fileId = '123456';   // Replace with a real file ID from Trash
  const folderId = '654321'; // Replace with destination folder ID
  await restoreFile(fileId, folderId);

  await emptyTrash();
})();
