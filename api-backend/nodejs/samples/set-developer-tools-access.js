// Set your DocSpace portal URL and token
const API_HOST = 'https://yourportal.onlyoffice.com';
const AUTH_TOKEN = 'your_access_token';

const HEADERS = { Authorization: AUTH_TOKEN };

// Step 1: Set Developer Tools access
async function setDevtoolsAccess(limited = true) {
  const url = `${API_HOST}/api/2.0/settings/devtoolsaccess`;
  const payload = { limitedAccessForUsers: limited };

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log(`Failed to update access settings. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  const data = (await res.json())?.response ?? {};
  console.log('Developer Tools access settings updated:');
  console.log(`• Limited for users: ${data.limitedAccessForUsers}`);
  console.log(`• Last Modified: ${data.lastModified}`);
  return data;
}

// Example usage
(async () => {
  try {
    console.log('Setting Developer Tools access...');
    await setDevtoolsAccess(false); // True = limit for users, False = allow full access
  } catch (err) {
    console.error(err.message);
  }
})();
