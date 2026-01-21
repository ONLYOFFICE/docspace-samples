/*
Example: Get login history

This example automates the retrieval of the last login events in ONLYOFFICE DocSpace.
It extracts unique user IDs from the latest login records, ensuring that duplicate entries are removed.

Using methods:
- GET /api/2.0/security/audit/login/last (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-last-login-events/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

function getLastLoginUsers() {
  const url = `${API_HOST}/api/2.0/security/audit/login/last`;

  return fetch(url, { method: 'GET', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Last login users retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      if (!data) return null;
      const list = data.response || [];
      const userIds = Array.from(new Set(list.map((user) => user.userId)));
      console.log(`Last login users: ${JSON.stringify(userIds)}`);
      return userIds;
    })
    .catch((err) => {
      console.log(`Last login users retrieval error: ${err.message}`);
      return null;
    });
}

// Run
getLastLoginUsers().then((userIds) => {
  console.log(userIds);
});
