// Set your DocSpace portal URL and API key
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
};

// Step 1: Move members from one group to another
async function moveGroupMembers(fromGroupId, toGroupId) {
  const url = `${API_HOST}/api/2.0/group/${fromGroupId}/members/${toGroupId}`;
  const res = await fetch(url, { method: 'PUT', headers: HEADERS });

  if (!res.ok) {
    const text = await res.text();
    console.log(`Move members failed. Status code: ${res.status}, Message: ${text}`);
    return;
  }

  console.log(`Members moved from group ${fromGroupId} to group ${toGroupId}`);
}

// Run
(async () => {
  try {
    await moveGroupMembers(
      '08e455dc-98c4-4390-b36f-54757080149c', // Replace with source group ID
      '258efd0c-b5b7-4bc9-87ab-e39b2c2eb09c'  // Replace with destination group ID
    );
  } catch (err) {
    console.log(`Move members error: ${err.message}`);
  }
})();
