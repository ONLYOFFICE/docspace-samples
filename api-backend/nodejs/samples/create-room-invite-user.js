/*
Example: Create a room and invite a user

This example demonstrates how to programmatically create a new room in ONLYOFFICE DocSpace and invite a user to it via email with specific access permissions.

Using methods:
- POST /api/2.0/files/rooms (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-room/)
- PUT /api/2.0/files/rooms/{roomId}/share (https://api.onlyoffice.com/docspace/api-backend/usage-api/set-room-security/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Create a new room
function createRoom(title) {
  const url = `${API_HOST}/api/2.0/files/rooms`;
  const data = {
    title: title,
    roomType: 2, // Type 2 = collaboration room
  };

  return fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Room creation failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .then((json) => (json ? json.response?.id ?? null : null))
    .catch((err) => {
      console.log(`Room creation error: ${err.message}`);
      return null;
    });
}

// Step 2: Invite a user to the room
function inviteUserToRoom(roomId, email, access) {
  const url = `${API_HOST}/api/2.0/files/rooms/${roomId}/share`;
  const data = {
    invitations: [
      {
        email: email,
        access: access,
      },
    ],
    notify: true,
    message: 'You have been invited to a room',
  };

  return fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      if (res.status === 200) {
        console.log(`User ${email} invited to room ${roomId} with access ${access}`);
      } else {
        const text = await res.text();
        console.log(`Invitation failed. Status code: ${res.status}, Message: ${text}`);
      }
    })
    .catch((err) => {
      console.log(`Invitation error: ${err.message}`);
    });
}

// Run
const roomTitle = 'Project Collaboration';
const userEmail = 'example.user@mail.com';
const userAccess = 'Editing';

createRoom(roomTitle).then((roomId) => {
  if (roomId) {
    inviteUserToRoom(roomId, userEmail, userAccess);
  }
});
