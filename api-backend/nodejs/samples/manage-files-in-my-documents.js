/*
Example: Manage files in "My Documents"

This example demonstrates how to interact with a user's personal space ("My Documents") in ONLYOFFICE DocSpace using the API.
It includes retrieving contents, uploading a file, creating a new document, and deleting a file.

Using methods:
- GET /api/2.0/security/activeconnections (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-my-folder/)
- PUT /api/2.0/security/activeconnections/logoutallexceptthis (https://api.onlyoffice.com/docspace/api-backend/usage-api/upload-file-to-my/)
- PUT /api/2.0/security/activeconnections/logout/{loginEventId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-file-in-my-documents/)
- PUT /api/2.0/security/activeconnections/logoutall/{userId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-file/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
};

// Step 1: Get "My Documents" contents
function getMyDocuments() {
  const url = `${API_HOST}/api/2.0/files/@my`;
  return fetch(url, { method: 'GET', headers: HEADERS })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`"My Documents" retrieval failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`"My Documents" retrieval error: ${err.message}`);
      return null;
    });
}

// Step 2: Upload a file to "My Documents"
function uploadFileToMy(filePath) {
  const url = `${API_HOST}/api/2.0/files/@my/upload`;

  // Build multipart form-data with Blob (no external deps)
  const form = new FormData();
  try {
    const fs = require('node:fs');
    const path = require('node:path');
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer]);
    form.append('file', blob, path.basename(filePath));
  } catch (e) {
    console.error('Failed to read file:', e.message);
    return Promise.resolve(null);
  }

  // Do NOT set Content-Type manually; fetch will set the multipart boundary
  return fetch(url, { method: 'POST', headers: { Authorization: HEADERS.Authorization }, body: form })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Upload to "My Documents" failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`Upload to "My Documents" error: ${err.message}`);
      return null;
    });
}

// Step 3: Create an empty file in "My Documents"
function createFileInMy(fileTitle) {
  const url = `${API_HOST}/api/2.0/files/@my/file`;
  const data = { title: fileTitle };

  return fetch(url, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`File creation in "My Documents" failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`File creation in "My Documents" error: ${err.message}`);
      return null;
    });
}

// Step 4: Delete a file from "My Documents"
function deleteFile(fileId, immediately = true, deleteAfter = false) {
  const url = `${API_HOST}/api/2.0/files/file/${fileId}`;
  const data = { immediately, deleteAfter };

  return fetch(url, {
    method: 'DELETE',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`File deletion from "My Documents" failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`File deletion from "My Documents" error: ${err.message}`);
      return null;
    });
}

// Run (mirrors the Python example)
getMyDocuments();

const file_path = 'example.pdf'; // Replace with actual path to the file
uploadFileToMy(file_path);

const file_title = 'NewDocument.docx';
createFileInMy(file_title);

const file_id = '123456'; // Replace with an actual file ID
deleteFile(file_id);
