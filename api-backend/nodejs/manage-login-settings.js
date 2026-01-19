// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Update login settings
async function updateLoginSettings(attemptCount, blockTime, checkPeriod) {
  const url = `${API_HOST}/api/2.0/settings/security/loginsettings`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ attemptCount, blockTime, checkPeriod }),
  });

  if (res.ok) {
    console.log('Login settings updated successfully.');
  } else {
    const text = await res.text();
    console.log(`Login settings update failed. Status code: ${res.status}, Message: ${text}`);
  }
}

// Step 2: Retrieve current login settings
async function getLoginSettings() {
  const url = `${API_HOST}/api/2.0/settings/security/loginsettings`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });

  if (res.ok) {
    const settings = await res.json();
    console.log('Login settings retrieved:', settings);
    return settings;
  } else {
    const text = await res.text();
    console.log(`Login settings retrieval failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
}

// Step 3: Reset login settings to default
async function resetLoginSettings() {
  const url = `${API_HOST}/api/2.0/settings/security/loginsettings`;
  const res = await fetch(url, { method: 'DELETE', headers: HEADERS });

  if (res.ok) {
    console.log('Login settings reset to default successfully.');
  } else {
    const text = await res.text();
    console.log(`Login settings reset failed. Status code: ${res.status}, Message: ${text}`);
  }
}

// Run
(async () => {
  // Step 1: Update login settings
  await updateLoginSettings(10, 30, 100);

  // Step 2: Retrieve current login settings (verify update)
  await getLoginSettings();

  // Step 3: Reset to default and verify
  await resetLoginSettings();
  await getLoginSettings();
})();
