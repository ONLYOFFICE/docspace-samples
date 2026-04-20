/*
Example: Manage folders

This example demonstrates how to manage folders in ONLYOFFICE DocSpace using the API.
It covers creating, retrieving, renaming, and deleting folders through API requests.

Using methods:
- POST /api/2.0/files/folder/{parentFolderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-folder/)
- GET /api/2.0/files/folder/{folderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-folder-info/)
- PUT /api/2.0/files/folder/{folderId}/rename (https://api.onlyoffice.com/docspace/api-backend/usage-api/rename-folder/)
- DELETE /api/2.0/files/folder/{folderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-folder/)
*/

// Set API base URL
const BASE_URL = 'https://yourportal.onlyoffice.com';
const API_KEY = 'YOUR_API_KEY';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Create a folder
function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function createFolder(parentFolderId, folderName) {
  const url = `${BASE_URL}/api/2.0/files/folder/${parentFolderId}`;
  const data = { title: folderName };
  return fetchWithTimeout(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(data) })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Folder creation failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`Folder creation error: ${err.message}`);
      return null;
    });
}

// Step 2: Retrieve folder details
function getFolderDetails(folderId) {
  const url = `${BASE_URL}/api/2.0/files/folder/${folderId}`;
  return fetchWithTimeout(url, { method: 'GET', headers: HEADERS })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Folder details retrieval failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`Folder details retrieval error: ${err.message}`);
      return null;
    });
}

// Step 3: Rename a folder
function renameFolder(folderId, newName) {
  const url = `${BASE_URL}/api/2.0/files/folder/${folderId}/rename`;
  const data = { title: newName };
  return fetchWithTimeout(url, { method: 'PUT', headers: HEADERS, body: JSON.stringify(data) })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Folder rename failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`Folder rename error: ${err.message}`);
      return null;
    });
}

// Step 4: Delete a folder
function deleteFolder(folderId) {
  const url = `${BASE_URL}/api/2.0/files/folder/${folderId}`;
  return fetchWithTimeout(url, { method: 'DELETE', headers: HEADERS })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Folder deletion failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`Folder deletion error: ${err.message}`);
      return null;
    });
}

async function main() {
  const parentFolderId = 1234;
  const folderId = 1234;
  const folderName = 'New Folder';
  const newFolderName = 'Updated Folder Name';

  const created = await createFolder(parentFolderId, folderName);
  if (!created) return;

  const details = await getFolderDetails(folderId);
  if (!details) return;

  const renamed = await renameFolder(folderId, newFolderName);
  if (!renamed) return;

  await deleteFolder(folderId);
}

main();
