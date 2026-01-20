/*
Example: List API keys

This example demonstrates how to retrieve all API keys associated with the current user in ONLYOFFICE DocSpace.
The response includes metadata such as name, permissions, status, and expiration date.

Using methods:
- GET /api/2.0/keys (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-api-keys/)
*/

// Set your DocSpace portal URL and access token
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authorization token
const HEADERS = {
  Authorization: API_KEY,
};

// Step 1: Get all API keys for the current user
function listApiKeys() {
  const url = `${API_HOST}/api/2.0/keys`;

  return fetch(url, { method: 'GET', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`API keys retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      const keys = data?.response || [];
      console.log(`Found ${keys.length} API key(s):`);
      keys.forEach((key) => {
        console.log(`\n• Name: ${key.name}`);
        console.log(`  Postfix: ${key.keyPostfix}`);
        console.log(`  Active: ${key.isActive}`);
        console.log(`  Permissions: ${key.permissions}`);
        console.log(`  Created on: ${key.createOn}`);
        console.log(`  Last used: ${key.lastUsed}`);
        console.log(`  Expires at: ${key.expiresAt}`);
      });
      return keys;
    })
    .catch((err) => {
      console.log(`API keys retrieval error: ${err.message}`);
      return null;
    });
}

// Run the method
listApiKeys();
