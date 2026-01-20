/*
Example: Search users by extended filter

This example demonstrates how to retrieve a list of users in ONLYOFFICE DocSpace with optional extended filter parameters such as group ID,
employee type, administrator status, and result limit.

Using methods:
- GET /api/2.0/people/filter (https://api.onlyoffice.com/docspace/api-backend/usage-api/search-users-by-extended-filter/)
*/

// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

const HEADERS = {
  Authorization: API_KEY,
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

// Step 1: Search users with extended filters
async function filterUsers({ groupId = null, employeeType = null, isAdmin = true, count = 10 } = {}) {
  const params = new URLSearchParams();
  params.set('count', String(count));
  if (groupId) params.set('groupId', groupId);
  if (employeeType) params.set('employeeType', employeeType);
  if (typeof isAdmin === 'boolean') params.set('isAdministrator', String(isAdmin).toLowerCase());

  const url = `${API_HOST}/api/2.0/people/filter?${params.toString()}`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });

  if (!res.ok) {
    const text = await res.text();
    console.log(`Users retrieval failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  const data = await res.json();
  const users = data?.response || [];
  console.log(`Found ${users.length} user(s) with filters:`);
  for (const user of users) {
    console.log(`- ${user.displayName} | Dept: ${user.department} | Admin: ${user.isAdmin}`);
  }
  return users;
}

// Run
(async () => {
  try {
    await filterUsers({
      groupId: 'e02a91ef-542f-11ee-8c99-0242ac120002',
      employeeType: 'User',
      isAdmin: true,
      count: 5,
    });
  } catch (err) {
    console.log(`Users retrieval error: ${err.message}`);
  }
})();
