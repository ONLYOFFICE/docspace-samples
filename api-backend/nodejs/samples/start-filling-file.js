/*
Example: Start filling a form file

This example demonstrates how to start a form filling session for a file in ONLYOFFICE DocSpace.
It is typically used for form templates or documents that should be opened in fill mode.
Use a file ID for a compatible form/template file that supports fill mode.

Using methods:
- PUT /api/2.0/files/file/{fileId}/startfilling (https://api.onlyoffice.com/docspace/api-backend/usage-api/start-filling/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: 'application/json',
};

async function startFilling(fileId) {
  const url = `${API_HOST}/api/2.0/files/file/${fileId}/startfilling`;
  const res = await fetch(url, { method: 'PUT', headers: HEADERS });
  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Start filling failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
  return res.json();
}

(async () => {
  try {
    const fileId = '123456'; // Replace with your actual file ID
    const result = await startFilling(fileId);
    console.log('Start filling result:', result);
  } catch (err) {
    console.error(err?.message || err);
  }
})();
