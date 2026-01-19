
//Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';

//Primary credentials (internal provider)
const CREDENTIALS = {
  userName: 'you@example.com',
  password: 'your_password',
  remember: true,
};

const TOTP_CODE = '123456'; // replace with actual code from authenticator app

const HEADERS = {
  'Content-Type': 'application/json',
};

//Step 1: start authentication with login/password
function primaryAuth() {
  return fetch(`${API_HOST}/api/2.0/authentication`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(CREDENTIALS),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    const resp = data.response || {};
    const token = resp.token;
    if (res.status === 200 && token) {
      console.log('Authenticated (no 2FA).');
      return { token, meta: resp };
    }
    if (res.status === 200) {
      console.log('2FA required.');
      return { token: null, meta: resp }; // may include tfaKey
    }
    const text = await res.text().catch(() => '');
    throw new Error(`Primary auth failed. Status: ${res.status}. ${text}`);
  });
}

//Step 2: confirm login with TOTP code
function confirmWithCode(meta) {
  const headers = { ...HEADERS };
  if (meta.tfaKey) headers['asc_auth_key'] = meta.tfaKey;

  const body = {
    userName: CREDENTIALS.userName,
    password: CREDENTIALS.password,
    code: TOTP_CODE,
    session: true,
  };

  return fetch(`${API_HOST}/api/2.0/authentication/${TOTP_CODE}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    const token = (data.response || {}).token;
    if (res.status === 200 && token) {
      console.log('Authenticated with TOTP code.');
      return token;
    }
    const text = await res.text().catch(() => '');
    throw new Error(`Confirm failed. Status: ${res.status}. ${text}`);
  });
}

// Run
primaryAuth()
  .then(({ token, meta }) => (token ? token : confirmWithCode(meta)))
  .then((token) => console.log('Token:', token))
  .catch((err) => console.log(`Error: ${err.message}`));