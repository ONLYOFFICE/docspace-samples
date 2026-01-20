// Set your DocSpace portal URL and API key
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key
const HEADERS = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

// Step 1: Remove members from a group
async function removeGroupMembers(groupId, members) {
  const url = `${API_HOST}/api/2.0/group/${groupId}/members`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: HEADERS,
    body: JSON.stringify({ members }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log(`Remove members failed. Status code: ${res.status}, Message: ${text}`);
    return;
  }

  console.log(`Members removed from group ${groupId}: ${JSON.stringify(members)}`);
}

// Run the method
(async () => {
  try {
    console.log('Removing members from the group...');
    await removeGroupMembers(
      'c652dba3-210e-436d-b264-df5ceda0a48e', // Replace with your group ID
      ['4c65a238-ca50-4374-b904-0d51d4c1822b'] // Replace with member IDs to remove
    );
  } catch (err) {
    console.log(`Remove members error: ${err.message}`);
  }
})();
