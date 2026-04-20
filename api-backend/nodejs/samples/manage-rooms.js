/*
Example: Manage rooms

This example demonstrates how to manage rooms in ONLYOFFICE DocSpace using the API.
It covers creating, retrieving, renaming, archiving, and deleting rooms through API requests.

Using methods:
- POST /api/2.0/files/rooms (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-room/)
- GET /api/2.0/files/rooms/{roomId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-room-info/)
- PUT /api/2.0/files/rooms/{roomId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-room/)
- PUT /api/2.0/files/rooms/{roomId}/archive (https://api.onlyoffice.com/docspace/api-backend/usage-api/archive-room/)
- DELETE /api/2.0/files/rooms/{roomId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-room/)
*/

// Set API base URL
const BASE_URL = 'https://yourportal.onlyoffice.com';
const API_KEY = 'YOUR_API_KEY';

// Headers with API key for authentication
const HEADERS = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};
function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}


// Step 1: Create a room
async function createRoom(roomName, description) {
  const url = `${BASE_URL}/api/2.0/files/rooms`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ title: roomName, description, roomType: 2 }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Create room failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
  const json = await res.json();
  return json.response;
}

// Step 2: Retrieve room details
async function getRoomDetails(roomId) {
  const url = `${BASE_URL}/api/2.0/files/rooms/${roomId}`;
  const res = await fetchWithTimeout(url, { method: 'GET', headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Get room failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
  const roomInfo = await res.json();
  return roomInfo.response;
}

// Step 3: Rename a room
async function renameRoom(roomId, newName) {
  const url = `${BASE_URL}/api/2.0/files/rooms/${roomId}`;
  const res = await fetchWithTimeout(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ title: newName }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Rename room failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
}

// Step 4: Archive a room
async function archiveRoom(roomId) {
  const url = `${BASE_URL}/api/2.0/files/rooms/${roomId}/archive`;
  const res = await fetchWithTimeout(url, { method: 'PUT', headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Archive room failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
}

// Step 5: Delete a room
async function deleteRoom(roomId) {
  const url = `${BASE_URL}/api/2.0/files/rooms/${roomId}`;
  const res = await fetchWithTimeout(url, { method: 'DELETE', headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Delete room failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
}

// Run
(async () => {
  const roomName = 'New Room';                // Replace with actual room name
  const description = 'This is a test room.';  // Replace with actual room description
  const newRoomName = 'Updated Room Name';   // Replace with actual new room name
  const roomId = 1234                         // Replace with actual room ID

  try {
    // Step 1
    await createRoom(roomName, description);

    // Step 2
    await getRoomDetails(roomId);

    // Step 3
    await renameRoom(roomId, newRoomName);

    // Step 4
    await archiveRoom(roomId);

    // Step 5
    await deleteRoom(roomId);
  } catch (error) {
    console.error(error.message);
  }
})();
