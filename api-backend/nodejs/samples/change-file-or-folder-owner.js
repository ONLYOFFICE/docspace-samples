// Set your DocSpace portal URL, access token, and IDs
const BASE_URL = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

const HEADERS = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

// Step 1: Define file and/or folder IDs to transfer
const fileIds = [12345]; // Replace with your file IDs
const folderIds = [67890]; // Replace with folder IDs if needed
const newOwnerId = 'user_uuid_here'; // New owner's UUID

const payload = {
  fileIds: fileIds,
  folderIds: folderIds,
  userId: newOwnerId,
};

// Step 2: Send the ownership change request
async function changeOwnership(payload) {
  const url = `${BASE_URL}/api/2.0/files/owner`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(payload),
    });

    if (res.status !== 200) {
      const text = await res.text();
      console.log(`Ownership update failed. Status code: ${res.status}, Message: ${text}`);
      return;
    }

    const data = await res.json();
    const result = data?.response ?? [];

    console.log('Ownership successfully updated for the following items:');
    result.forEach((entry) => {
      const title = entry?.title ?? 'Unnamed';
      const shared = entry?.access?.shared ?? false;
      console.log(`- ${title} (Shared: ${shared})`);
    });
  } catch (err) {
    console.log(`Ownership update error: ${err}`);
  }
}

// Run the method
changeOwnership(payload);