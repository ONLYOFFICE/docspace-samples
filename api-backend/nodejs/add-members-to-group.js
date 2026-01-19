// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key
const HEADERS = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

// Step 1: Add members to a group (optionally rename and/or change manager)
async function addMembersToGroup(groupId, members, newName = null, newManager = null) {
  const url = `${API_HOST}/api/2.0/group/${groupId}`;
  const data = { membersToAdd: members };
  if (newName) data.groupName = newName;
  if (newManager) data.groupManager = newManager;

  const res = await fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log(`Group update failed. Status code: ${res.status}, Message: ${text}`);
    return;
  }

  console.log(`Members added to group ${groupId}: ${JSON.stringify(members)}`);
  if (newName) console.log(`Group renamed to: ${newName}`);
  if (newManager) console.log(`New manager assigned: ${newManager}`);
}

// Run the method
(async () => {
  await addMembersToGroup(
    'c652dba3-210e-436d-b264-df5ceda0a48e', // Replace with your group ID
    ['d9be1cab-3ab4-4012-ad60-48218b2713dc', '4c65a238-ca50-4374-b904-0d51d4c1822b'], // Member UUIDs
    'Project Alpha Team',
    'c652dba3-210e-436d-b264-df5ceda0a48e'
  );
})();