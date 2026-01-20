// Set your DocSpace portal URL and access token
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authorization token
const HEADERS = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

// Step 1: Create an API key
function createApiKey(name, permissions, expiresInDays) {
  const url = `${API_HOST}/api/2.0/keys`;
  const payload = {
    name: name,
    permissions: permissions,
    expiresInDays: expiresInDays,
  };

  return fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`API key creation failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      if (!data) return;
      const resp = data.response || {};
      console.log('API Key created successfully:');
      console.log(`• Name: ${resp.name}`);
      console.log(`• Key: ${resp.key}`);
      console.log(`• Postfix: ${resp.keyPostfix}`);
      console.log(`• Permissions: ${resp.permissions}`);
      console.log(`• Expires: ${resp.expiresAt}`);
    })
    .catch((err) => {
      console.log(`API key creation error: ${err.message}`);
    });
}

// Run the method
createApiKey('Integration Bot', ['files:read', 'files:write', 'rooms:read', 'rooms:write'], 30);
