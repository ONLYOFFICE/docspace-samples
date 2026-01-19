// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Update IP restrictions settings
async function saveRestrictions(ipRestrictions, enable = true) {
  const url = `${API_HOST}/api/2.0/settings/iprestrictions`;
  const body = JSON.stringify({ enable, ipRestrictions });

  const res = await fetch(url, { method: 'PUT', headers: HEADERS, body });
  if (!res.ok) {
    const text = await res.text();
    console.log(`IP restrictions update failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
  const settings = await res.json();
  console.log('IP restrictions updated successfully.');
  return settings;
}

// Step 2: Retrieve current IP restrictions settings
async function getRestrictions() {
  const url = `${API_HOST}/api/2.0/settings/iprestrictions`;

  const res = await fetch(url, { method: 'GET', headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    console.log(`IP restrictions retrieval failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
  const settings = await res.json();
  console.log('IP restrictions settings retrieved:', settings);
  return settings;
}

// Run
(async () => {
  await saveRestrictions([
    { ip: '192.168.1.1', forAdmin: true },
  ]);

  await getRestrictions();
})();
