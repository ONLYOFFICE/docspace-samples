/*
Example: Update an API Key

This example demonstrates how to update an existing API key in DocSpace using the API.
You can change the name, permissions, or status of the key by providing its unique ID (UUID).

Using methods:
- PUT /api/2.0/keys/{keyId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-api-key/)
*/

// Set your DocSpace portal URL and access token
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authorization token
const HEADERS = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

// Step 1: Update an API key
async function updateApiKey(keyId, newName, newPermissions, isActive = true) {
  const url = `${API_HOST}/api/2.0/keys/${keyId}`;
  const payload = {
    name: newName,
    permissions: newPermissions,
    isActive: isActive,
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log(`API key update failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  const data = await res.json();
  if (data?.response === true) {
    console.log('API key updated successfully.');
    return true;
  } else {
    console.log('API key update failed. Unexpected response.');
    return null;
  }
}

// Example usage
(async () => {
  try {
    await updateApiKey(
      'your_key_uuid',
      'Updated Integration Bot Key',
      ['files:read', 'files:write', 'rooms:read', 'rooms:write', 'accounts:read'],
      true
    );
  } catch (err) {
    console.error(err.message);
  }
})();
