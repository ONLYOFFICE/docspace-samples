/*
Example: Create a file link with password and expiration

This example demonstrates how to create or update a primary external link for a file in ONLYOFFICE DocSpace,
protect it with a password, and set an expiration date.

Using methods:
- PUT /api/2.0/files/file/{id}/links (https://api.onlyoffice.com/docspace/api-backend/usage-api/set-file-external-link/)
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

function unwrapResponse(json) {
  return json && typeof json === 'object' && 'response' in json ? json.response : json;
}

function pickShareLink(data) {
  const candidate = data?.sharedLink || data?.response?.sharedLink || data;
  return {
    shareLink: candidate?.shareLink || null,
    requestToken: candidate?.requestToken || null,
    expirationDate: candidate?.expirationDate || null,
    password: candidate?.password || null,
  };
}

// Step 1: Create or update the external link
async function setExternalLink(fileId, password, expiresAt) {
  const url = `${API_HOST}/api/2.0/files/file/${fileId}/links`;
  const body = {
    access: 'Read',
    internal: false,
    primary: true,
    title: 'Public link with password and expiration',
    password,
    expirationDate: {
      utcTime: expiresAt,
    },
  };

  const res = await fetchWithTimeout(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`External link creation failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  return unwrapResponse(await res.json());
}

// Run example
(async () => {
  try {
    const fileId = 123456; // Replace with the actual file ID
    const password = 'StrongPass123!';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const result = await setExternalLink(fileId, password, expiresAt);

    if (result) {
      const linkData = pickShareLink(result);
      const maskedToken = linkData.requestToken
        ? `${linkData.requestToken.slice(0, 6)}...`
        : '(none)';
      console.log('External link created or updated successfully.');
      console.log('Share link:', linkData.shareLink);
      console.log('Request token:', maskedToken);
      console.log('Expiration date:', linkData.expirationDate);
      // Password is not logged to avoid leaking it into CI logs or shell history.
    }
  } catch (err) {
    console.error(err?.message || err);
  }
})();
