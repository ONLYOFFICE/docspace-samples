// Set your DocSpace portal URL and access token
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authorization token
const HEADERS = {
  Authorization: API_KEY,
};

// Step 1: Delete the API key by ID
function deleteApiKey(keyId) {
  const url = `${API_HOST}/api/2.0/keys/${keyId}`;

  return fetch(url, {
    method: 'DELETE',
    headers: HEADERS,
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`API key deletion failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .then((data) => {
      if (data?.response === true) {
        console.log('API key deleted successfully.');
      }
    })
    .catch((err) => {
      console.log(`API key deletion error: ${err.message}`);
    });
}

// Run the method
deleteApiKey('your_key_uuid');
