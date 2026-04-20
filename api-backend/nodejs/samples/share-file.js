/*
Example: Share a file

This example demonstrates how to share a file with a user by email (or by id) using the API.

Using methods:
- PUT /api/2.0/files/file/{fileId}/share (https://api.onlyoffice.com/docspace/api-backend/usage-api/set-file-security/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function shareFile(fileId, share, notify = false, message = '') {
  const url = `${API_HOST}/api/2.0/files/file/${fileId}/share`;
  const body = { share, notify };
  if (message) body.message = message;

  const res = await fetchWithTimeout(url, { method: 'PUT', headers: HEADERS, body: JSON.stringify(body) });
  if (res.status !== 200) {
    const text = await res.text();
    console.error(`File share failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
  return res.json();
}

(async () => {
  try {
    const fileId = '123456'; // Replace with your actual file ID

    // For this file share endpoint, use the `share` field with entries like { email, access } or { id, access }.
    const share = [
      { email: 'recipient@example.com', access: 'Read' },
      // { id: '987654', access: 'ReadWrite' },
    ];

    const result = await shareFile(fileId, share, true, 'You have access to the file.');
    console.log('Share file result:', result);
  } catch (err) {
    console.error(err?.message || err);
  }
})();
