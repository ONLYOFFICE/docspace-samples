/*
Example: Manage files

This example demonstrates how to manage files in ONLYOFFICE DocSpace using the API.
It covers creating, uploading, updating, and deleting files through API requests.

Using methods:
- POST /api/2.0/files/{folderId}/file (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-file/)
- POST /api/2.0/files/{folderId}/upload (https://api.onlyoffice.com/docspace/api-backend/usage-api/upload-file/)
- PUT /api/2.0/files/file/{fileId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-file/)
- DELETE /api/2.0/files/file/{fileId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-file/)
*/

// Set API base URL
const BASE_URL = 'https://yourportal.onlyoffice.com';
const API_KEY = 'YOUR_API_KEY';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Create an empty file
function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function createFile(folderId, fileName) {
  const url = `${BASE_URL}/api/2.0/files/${folderId}/file`;
  const data = { title: fileName };

  return fetchWithTimeout(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`File creation failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`File creation error: ${err.message}`);
      return null;
    });
}

// Step 2: Upload a file
function uploadFile(folderId, filePath) {
  const url = `${BASE_URL}/api/2.0/files/${folderId}/upload`;

  const fs = require('node:fs');
  const path = require('node:path');

  const form = new FormData();
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  form.append('file', blob, path.basename(filePath));

  return fetchWithTimeout(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`File upload failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`File upload error: ${err.message}`);
      return null;
    });
}

// Step 3: Update an existing file
function updateFile(fileId, newFilePath) {
  const url = `${BASE_URL}/api/2.0/files/file/${fileId}`;

  const fs = require('node:fs');
  const path = require('node:path');

  const form = new FormData();
  const buffer = fs.readFileSync(newFilePath);
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  form.append('file', blob, path.basename(newFilePath));

  return fetchWithTimeout(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`File update failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`File update error: ${err.message}`);
      return null;
    });
}

// Step 4: Delete a file
function deleteFile(fileId) {
  const url = `${BASE_URL}/api/2.0/files/file/${fileId}`;
  const data = { immediately: true };

  return fetchWithTimeout(url, {
    method: 'DELETE',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`File deletion failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`File deletion error: ${err.message}`);
      return null;
    });
}

(async () => {
  const folderId = 776261; // Replace with actual folder ID
  const fileName = 'NewDocument1.docx'; // Replace with actual file name
  const filePath = 'path/to/upload_file.txt'; // Replace with actual file path
  const updatedFilePath = 'path/to/updated_file.txt'; // Replace with actual updated file path
  const fileId = 1187261; // Replace with actual file ID

  // Step 1
  await createFile(folderId, fileName);
  // Step 2
  await uploadFile(folderId, filePath);
  // Step 3
  await updateFile(fileId, updatedFilePath);
  // Step 4
  await deleteFile(fileId);
})();
