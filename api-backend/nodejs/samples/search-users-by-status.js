/*
Example: Search users by status

This example demonstrates how to search for users in ONLYOFFICE DocSpace based on their status (e.g., active, pending, disabled) using the API.
Additional filters such as query text, department, or custom fields can be applied.

Using methods:
- GET /api/2.0/people/status/{status}/search (https://api.onlyoffice.com/docspace/api-backend/usage-api/search-users-by-status/)
*/

// Set your DocSpace portal URL and access token
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

const HEADERS = { Authorization: API_KEY };

// Step 1: Search users by status with optional filters
async function searchUsersByStatus({ status = 'active', query = null, filterBy = null, filterValue = null } = {}) {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (filterBy) params.set('filterBy', filterBy);
  if (filterValue) params.set('filterValue', filterValue);

  const url = `${API_HOST}/api/2.0/people/status/${encodeURIComponent(status)}/search${params.toString() ? `?${params.toString()}` : ''}`;

  const res = await fetch(url, { method: 'GET', headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    console.log(`User search by status failed. Status code: ${res.status}, Message: ${text}`);
    return [];
  }

  const data = await res.json();
  const users = data?.response || [];
  console.log(`Found ${users.length} user(s) with status: ${status}`);
  for (const user of users) {
    console.log(`- ${user.displayName} | Email: ${user.email} | ID: ${user.id}`);
  }
  return users;
}

// Example usage
(async () => {
  try {
    await searchUsersByStatus({
      status: '1',            // Active status code
      query: '*',
      filterBy: 'department',
      filterValue: 'Sales',
    });
  } catch (err) {
    console.log(`User search by status error: ${err.message}`);
  }
})();
