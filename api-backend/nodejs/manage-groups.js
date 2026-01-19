// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Create a new group
async function createGroup(groupName, managerId, memberIds) {
  const url = `${API_HOST}/api/2.0/group`;
  const data = { groupName, groupManager: managerId, members: memberIds };

  const res = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(data) });
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

// Step 2: Retrieve group by ID
async function getGroupById(groupId) {
  const url = `${API_HOST}/api/2.0/group/${groupId}`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });
  if (!res.ok) {
    const t = await res.text();
    console.log(`Group retrieval failed. Status code: ${res.status}, Message: ${t}`);
    return null;
  }
  const json = await res.json();
  console.log(json);
  return json;
}

// Step 3: Update an existing group
async function updateGroup(groupId, newGroupName) {
  const url = `${API_HOST}/api/2.0/group/${groupId}`;
  const data = { groupName: newGroupName };

  const res = await fetch(url, { method: 'PUT', headers: HEADERS, body: JSON.stringify(data) });
  if (!res.ok) {
    const t = await res.text();
    console.log(`Group update failed. Status code: ${res.status}, Message: ${t}`);
    return null;
  }
  const json = await res.json();
  const id = json?.response?.id;
  console.log('Group updated successfully:', id);
  return id;
}

// Step 4: Delete a group
async function deleteGroup(groupId) {
  const url = `${API_HOST}/api/2.0/group/${groupId}`;
  const res = await fetch(url, { method: 'DELETE', headers: HEADERS });
  if (!res.ok) {
    const t = await res.text();
    console.log(`Group deletion failed. Status code: ${res.status}, Message: ${t}`);
    return null;
  }
  console.log(res.status);
  return res.status;
}

// Run sequence
(async () => {
  try {
    const group_name = 'New Group'; // Replace with actual group name
    const manager_id = '10001';     // Replace with actual manager ID
    const member_ids = ['10001', '10002']; // Replace with actual member IDs

    const groupId = await createGroup(group_name, manager_id, member_ids);
    await getGroupById(groupId);
    await updateGroup(groupId, 'Updated Group Name');
    await deleteGroup(groupId);
  } catch (err) {
    console.error(err.message);
  }
})();
