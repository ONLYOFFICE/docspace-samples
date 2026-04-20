/*
Example: Save a file as PDF

This example demonstrates how to save an existing file as a PDF document in ONLYOFFICE DocSpace.
The converted PDF file is created in the target folder specified in the request body.

Using methods:
- POST /api/2.0/files/file/{id}/saveaspdf (https://api.onlyoffice.com/docspace/api-backend/usage-api/save-file-as-pdf/)
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

// Step 1: Save an existing file as PDF
function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function saveFileAsPdf(fileId, folderId, title) {
  const url = `${API_HOST}/api/2.0/files/file/${fileId}/saveaspdf`;
  const body = {
    folderId,
    title,
  };

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Save as PDF failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  const json = await res.json();
  return json?.response ?? null;
}

// Run example
(async () => {
  try {
    const fileId = 123456; // Replace with the source file ID
    const folderId = 12345; // Replace with the target folder ID
    const pdfTitle = 'Converted-document.pdf';

    const result = await saveFileAsPdf(fileId, folderId, pdfTitle);

    if (result) {
      console.log('PDF file created successfully.');
      console.log(`New file ID: ${result.id}`);
      console.log(`New file title: ${result.title}`);
      console.log(`Folder ID: ${result.folderId}`);
    }
  } catch (err) {
    console.error(err?.message || err);
  }
})();
