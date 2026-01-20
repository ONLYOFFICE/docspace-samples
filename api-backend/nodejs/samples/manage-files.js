// Set API base URL
const BASE_URL = 'https://yourportal.onlyoffice.com';
const API_KEY = 'YOUR_API_KEY';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Create an empty file
function createFile(folderId, fileName) {
  const url = `${BASE_URL}/api/2.0/files/${folderId}/file`;
  const data = { title: fileName };

  return fetch(url, {
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

  return fetch(url, {
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

  return fetch(url, {
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

  return fetch(url, {
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

function main() {
  const folder_id = 776261; // Replace with actual folder ID
  const file_name = 'NewDocument1.docx'; // Replace with actual file name
  const file_path = 'path/to/upload_file.txt'; // Replace with actual file path
  const updated_file_path = 'path/to/updated_file.txt'; // Replace with actual updated file path
  const file_id = 1187261; // Replace with actual file ID

  // Step 1
  createFile(folder_id, file_name)
  // Step 2
  uploadFile(folder_id, file_path)
  // Step 3
  updateFile(file_id, updated_file_path)
  // Step 4
  deleteFile(file_id)
}

main();
