// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Set a room access link
async function setRoomLink(roomId, accessLevel = 2, expirationDate = null, internal = true, primary = false) {
  const url = `${API_HOST}/api/2.0/files/rooms/${roomId}/links`;
  const body = JSON.stringify({
    access: accessLevel,
    expirationDate,
    internal,
    primary,
  });

  const res = await fetch(url, { method: 'PUT', headers: HEADERS, body });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Room link set failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
  return res.json();
}

// Step 2: Retrieve all links for a room
async function getRoomLinks(roomId) {
  const url = `${API_HOST}/api/2.0/files/rooms/${roomId}/links`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Room link set failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
  return res.json();
}

// Run example
(async () => {
  try {
    const roomId = '123456'; // Replace with your actual room ID

    const setResp = await setRoomLink(roomId, 2, null, true, false);
    console.log('Link set:', setResp);

    const links = await getRoomLinks(roomId);
    console.log('Links:', links);
  } catch (err) {
    console.error(err.message);
  }
})();
