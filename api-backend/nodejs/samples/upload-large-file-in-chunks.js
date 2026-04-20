/*
Example: Upload a large file in chunks

This example demonstrates how to upload a file larger than 10 MB to ONLYOFFICE DocSpace using an upload session.
The file is split into ordered chunks, and each chunk is uploaded to the session location until the file is fully uploaded.

Using methods:
- POST /api/2.0/files/{folderId}/upload/create_session (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-upload-session/)
*/

const fs = require('node:fs');
const path = require('node:path');

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Each chunk must be <= 10 MB and a multiple of 512 bytes
const CHUNK_SIZE = 10 * 1024 * 1024;

// Headers with API key for authentication
const JSON_HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const AUTH_HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
};

// Step 1: Create an upload session
function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function createUploadSession(folderId, fileName, fileSize) {
  const url = `${API_HOST}/api/2.0/files/${folderId}/upload/create_session`;
  const body = {
    CreateOn: new Date().toISOString(),
    FileName: fileName,
    FileSize: fileSize,
    folderId,
  };

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Upload session creation failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  return res.json();
}

// Step 2: Upload file chunks in order
async function uploadChunks(location, fileBuffer, fileName) {
  const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);
  let lastResponse = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileBuffer.length);
    const chunkBuffer = fileBuffer.subarray(start, end);

    const form = new FormData();
    const blob = new Blob([chunkBuffer], { type: 'application/octet-stream' });
    form.append('file', blob, fileName);

    const res = await fetchWithTimeout(location, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: form,
    });

    if (res.status !== 200 && res.status !== 201) {
      const text = await res.text();
      console.error(
        `Chunk upload failed at part ${chunkIndex + 1}/${totalChunks}. Status code: ${res.status}, Message: ${text}`,
      );
      return null;
    }

    lastResponse = await res.json();
    console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded`);
  }

  return lastResponse;
}

async function main() {
  const folderId = 12345; // Replace with the target folder ID
  const filePath = 'path/to/large-file.docx'; // Replace with the file path

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  if (fileBuffer.length <= CHUNK_SIZE) {
    console.log('This sample is intended for files larger than 10 MB.');
    return;
  }

  const session = await createUploadSession(folderId, fileName, fileBuffer.length);
  const location = session?.data?.location;

  if (!location) {
    console.log('Upload session location was not returned.');
    return;
  }

  const result = await uploadChunks(location, fileBuffer, fileName);

  if (result) {
    console.log('Upload completed successfully.');
    console.log(result);
  }
}

main().catch((err) => {
  console.error(`Large file upload error: ${err.message}`);
});
