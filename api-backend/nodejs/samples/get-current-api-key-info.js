// Set your DocSpace portal URL and access token
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with authorization token
const HEADERS = {
  Authorization: API_KEY,
};

// Step 1: Retrieve the current token's permissions
function getTokenPermissions() {
  const url = `${API_HOST}/api/2.0/keys/permissions`;

  return fetch(url, { method: 'GET', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Key permissions retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      const permissions = data?.response || [];
      console.log('Current Token Permissions:');
      permissions.forEach((perm) => console.log(`• ${perm}`));
      return permissions;
    })
    .catch((err) => {
      console.log(`Key permissions retrieval error: ${err.message}`);
      return null;
    });
}

// Run the method
getTokenPermissions();
