// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Create a Virtual Data Room with a text watermark
function createVdrRoom(roomTitle, roomDescription) {
  const url = `${API_HOST}/api/2.0/files/rooms`;
  const data = {
    title: roomTitle,
    description: roomDescription,
    roomType: 8, // VDR room
    watermark: {
      enabled: true,
      text: 'Confidential',
      rotate: -45,
      additions: 1, // Adds UserName
    },
  };

  return fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`VDR room creation failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`VDR room creation error: ${err.message}`);
      return null;
    });
}

// Run
const roomTitle = 'Secure VDR Room';
const roomDescription = 'A virtual room with a confidential watermark.';

createVdrRoom(roomTitle, roomDescription);
