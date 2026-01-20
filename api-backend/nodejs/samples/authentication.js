// Set API base URL
const BASE_URL = 'https://yourportal.onlyoffice.com';

// User credentials for authentication
const USER_CREDENTIALS = {
  userName: 'your-user-name',
  password: 'your-password',
};

// Step 1: Authenticate with your login and password
async function authenticate() {
  try {
    const res = await fetch(`${BASE_URL}/api/2.0/authentication`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(USER_CREDENTIALS),
    });

    if (res.status !== 200) {
      const text = await res.text();
      console.log(`Authentication failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    }

    const data = await res.json();
    return data?.response?.token ?? null;
  } catch (err) {
    console.log(`Authentication error: ${err}`);
    return null;
  }
}

// Step 2: Check authentication with a token you received
async function checkAuthentication(token) {
  try {
    const res = await fetch(`${BASE_URL}/api/2.0/authentication`, {
      method: 'GET',
      headers: { Authorization: token },
    });

    if (res.status === 200) {
      console.log(`User is authenticated with token ${token}.`);
    } else {
      const text = await res.text();
      console.log(`Authentication check failed. Status code: ${res.status}, Message: ${text}`);
    }
  } catch (err) {
    console.log(`Authentication check error: ${err}`);
  }
}

// Run
(async () => {
  const token = await authenticate();
  if (token) {
    await checkAuthentication(token);
  }
})();
