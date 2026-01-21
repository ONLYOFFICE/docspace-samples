/*
Example: Manage active portal connections

This example shows how to manage active user sessions in ONLYOFFICE DocSpace.
You can retrieve active sessions, log out all users except the current one, terminate a specific session, or revoke all sessions for a particular user.

Using methods:
- GET /api/2.0/security/activeconnections (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-all-active-connections/)
- PUT /api/2.0/security/activeconnections/logoutallexceptthis (https://api.onlyoffice.com/docspace/api-backend/usage-api/log-out-all-except-this-connection/)
- PUT /api/2.0/security/activeconnections/logout/{loginEventId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/log-out-active-connection/)
- PUT /api/2.0/security/activeconnections/logoutall/{userId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/log-out-all-active-connections-for-user/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

// Step 1: Retrieve all active portal connections
function getAllActiveConnections() {
  const url = `${API_HOST}/api/2.0/security/activeconnections`;
  return fetch(url, { method: 'GET', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Active connections retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      if (!data) return null;
      console.log(`Active connections retrieved successfully: ${JSON.stringify(data)}`);
      return data;
    })
    .catch((err) => {
      console.log(`Active connections retrieval error: ${err.message}`);
      return null;
    });
}

// Step 2: Log out all sessions except the current one
function logOutAllExceptCurrent() {
  const url = `${API_HOST}/api/2.0/security/activeconnections/logoutallexceptthis`;
  return fetch(url, { method: 'PUT', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Logout-all-except-current failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      if (!data) return null;
      console.log(`Logged out all connections except the current one: ${JSON.stringify(data)}`);
      return data;
    })
    .catch((err) => {
      console.log(`Logout-all-except-current error: ${err.message}`);
      return null;
    });
}

// Step 3: Log out a specific session by its login event ID
function logOutActiveConnection(loginEventId) {
  const url = `${API_HOST}/api/2.0/security/activeconnections/logout/${loginEventId}`;
  return fetch(url, { method: 'PUT', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Logout connection ${loginEventId} failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      if (!data) return null;
      console.log(`Logged out connection ${loginEventId}: ${JSON.stringify(data)}`);
      return data;
    })
    .catch((err) => {
      console.log(`Logout connection ${loginEventId} error: ${err.message}`);
      return null;
    });
}

// Step 4: Log out all sessions for a specific user
function logOutAllActiveConnectionsForUser(userId) {
  const url = `${API_HOST}/api/2.0/security/activeconnections/logoutall/${userId}`;
  return fetch(url, { method: 'PUT', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Logout all for user ${userId} failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      if (!data) return null;
      console.log(`Logged out all connections for user ${userId}: ${JSON.stringify(data)}`);
      return data;
    })
    .catch((err) => {
      console.log(`Logout all for user ${userId} error: ${err.message}`);
      return null;
    });
}

// Example usage
console.log('\nRetrieving all active connections:');
getAllActiveConnections().then((activeData) => {
  if (!activeData) {
    console.log('No active connections found.');
    return;
  }

  const items = activeData.response?.items || [];
  if (!items.length) {
    console.log('Active connections list is empty.');
    return;
  }

  console.log('\nLogging out all connections except the current one:');
  logOutAllExceptCurrent()
    .then(() => {
      const firstConnectionId = items[0].id;
      console.log(`\nLogging out the connection with ID ${firstConnectionId}:`);
      return logOutActiveConnection(firstConnectionId);
    })
    .then(() => {
      const userId = items[0].userId;
      console.log(`\nLogging out all connections for user ID ${userId}:`);
      return logOutAllActiveConnectionsForUser(userId);
    });
});
