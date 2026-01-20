/*
Example: Search users

This example demonstrates how to search for users in ONLYOFFICE DocSpace by a text query,
with optional filters for specific fields such as type, department, or role.

Using methods:
- GET /api/2.0/people/@search/{query} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-search/)
*/

// Set your DocSpace portal URL and access token
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

const HEADERS = { Authorization: API_KEY };

// Step 1: Search users by query and optional filters
async function searchUsers(query, filterBy = null, filterValue = null) {
  const params = new URLSearchParams();
  if (filterBy && filterValue) {
    params.set('filterBy', filterBy);
    params.set('filterValue', filterValue);
  }

  const qs = params.toString();
  const url = `${API_HOST}/api/2.0/people/@search/${encodeURIComponent(query)}${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, { method: 'GET', headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    console.log(`User search failed. Status code: ${res.status}, Message: ${text}`);
    return [];
  }

  const data = await res.json();
  const users = data?.response || [];
  console.log(`Found ${users.length} user(s) for query: '${query}'`);
  for (const user of users) {
    const role = user.isVisitor ? 'Visitor' : 'User';
    console.log(`- ${user.displayName} | ${user.email} | Role: ${role}`);
  }
  return users;
}

// Run examples
(async () => {
  try {
    await searchUsers('john');
    await searchUsers('guest', 'type', 'Visitor');
  } catch (err) {
    console.error(err.message);
  }
})();
