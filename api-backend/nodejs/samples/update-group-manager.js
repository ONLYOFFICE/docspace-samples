/*
Example: Update group manager

This example demonstrates how to update group manager in ONLYOFFICE DocSpace.

Using methods:
- POST /api/2.0/group (https://api.onlyoffice.com/docspace/api-backend/usage-api/add-group/)
- PUT /api/2.0/group/{groupId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-group/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Create a new group and add members
async function createGroup(groupName, managerId, memberIds) {
  const url = `${API_HOST}/api/2.0/group`;
  const res = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      groupName: groupName,
      groupManager: managerId,
      members: memberIds,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.log(`Group creation failed. Status code: ${res.status}, Message: ${t}`);
    return null;
  }

  const json = await res.json();
  const groupId = json?.response?.id;
  console.log('Group created successfully:', groupId);
  return groupId;
}

// Step 2: Reassign group ownership
async function reassignGroupManager(groupId, newManagerId) {
  const url = `${API_HOST}/api/2.0/group/${groupId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ groupManager: newManagerId }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.log(`Group manager reassignment failed. Status code: ${res.status}, Message: ${t}`);
    return;
  }

  console.log(`Group ${groupId} manager reassigned successfully to ${newManagerId}`);
}

// Run
(async () => {
  const manager_user_id = '10001';
  const user_id = '10002';

  // Step 1: Create a new group
  const group_id = await createGroup('Development Team', manager_user_id, [manager_user_id, user_id]);

  if (group_id) {
    // Step 2: Reassign group ownership to user
    await reassignGroupManager(group_id, user_id);
  }
})();
