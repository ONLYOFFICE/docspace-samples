/*
Example: Invite user with welcome message

This example demonstrates how to invite a user to ONLYOFFICE DocSpace using the API,check their registration status,
and send them a welcome message after successful activation.

Using methods:
- GET /api/2.0/portal/users/invite/{employeeType} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-invitation-link/)
- GET /api/2.0/portal/users/{userId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-user-by-id/)
- POST /api/2.0/portal/sendcongratulations (https://api.onlyoffice.com/docspace/api-backend/usage-api/send-congratulations/)
*/

// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'YOUR_TOKEN';
const HEADERS = { Authorization: API_KEY };

// Step 1: Get invitation link for a specific employee type
function getInviteLink(employeeType = 'Guest') {
  const url = `${API_HOST}/api/2.0/portal/users/invite/${employeeType}`;
  return fetch(url, { method: 'GET', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Invite link retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      const inviteUrl = data?.response;
      console.log(`Invite link for ${employeeType}: ${inviteUrl}`);
      return inviteUrl;
    })
    .catch((err) => {
      console.log(`Invite link retrieval error: ${err.message}`);
      return null;
    });
}

// Step 2: Check if the user is active
function checkUserStatus(userId) {
  const url = `${API_HOST}/api/2.0/portal/users/${userId}`;
  return fetch(url, { method: 'GET', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`User info retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      const user = data?.response || {};
      console.log('User Info:');
      console.log(`• Name: ${user.firstName} ${user.lastName}`);
      console.log(`• Email: ${user.email}`);
      console.log(`• Active: ${user.isActive}`);
      console.log(`• Created: ${user.createDate}`);
      return user;
    })
    .catch((err) => {
      console.log(`User info retrieval error: ${err.message}`);
      return null;
    });
}

// Step 3: Send welcome message
function sendCongratulations(userId, key = 'welcome_guest') {
  const params = new URLSearchParams({ Userid: userId, Key: key });
  const url = `${API_HOST}/api/2.0/portal/sendcongratulations?${params.toString()}`;

  return fetch(url, { method: 'POST', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) {
        console.log('Congratulations message sent successfully.');
      } else {
        return res.text().then((t) => {
          console.log(`Congratulations send failed. Status code: ${res.status}, Message: ${t}`);
        });
      }
    })
    .catch((err) => {
      console.error(err.message);
    });
}

// Run sequence (mirrors the Python flow)
console.log('Step 1: Generate invitation link...');
getInviteLink('Guest').then((link) => {
  // Simulate that user registers via this link...

  console.log('\nStep 2: Check user registration status...');
  const testUserId = 'REPLACE-WITH-REAL-USER-ID';
  checkUserStatus(testUserId).then((user) => {
    if (user && user.isActive) {
      console.log('\nStep 3: Send welcome message...');
      sendCongratulations(testUserId);
    }
  });
});
