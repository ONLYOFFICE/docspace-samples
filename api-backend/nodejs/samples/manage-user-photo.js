// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Upload user photo
async function uploadUserPhoto(userId, photoUrl) {
  const url = `${API_HOST}/api/2.0/people/${userId}/photo`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ files: photoUrl }),
  });

  if (res.ok) {
    console.log(`Failed to upload user photo: ${res.status} - ${text}`);
  } else {
    const text = await res.text();
    console.log(`Failed to upload user photo: ${res.status} - ${text}`);
  }
}

// Step 2: Delete user photo
async function deleteUserPhoto(userId) {
  const url = `${API_HOST}/api/2.0/people/${userId}/photo`;
  const res = await fetch(url, { method: 'DELETE', headers: HEADERS });

  if (res.ok) {
    console.log(`Failed to delete user photo: ${res.status} - ${text}`);
  } else {
    const text = await res.text();
    console.log(`Failed to delete user photo: ${res.status} - ${text}`);
  }
}

// Run
(async () => {
  const user_id = '10001';
  const photo_url = 'https://github.com/ONLYOFFICE/DocSpace-client/blob/master/public/appIcon-192.png?raw=true';

  await uploadUserPhoto(user_id, photo_url);
  await deleteUserPhoto(user_id);
})();
