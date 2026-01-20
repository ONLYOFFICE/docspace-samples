/*
Example: Update user role

This example demonstrates how to automate user onboarding in ONLYOFFICE DocSpace using the API.
It covers creating a user, retrieving their profile, and updating their role.

Using methods:
- POST /api/2.0/people (https://api.onlyoffice.com/docspace/api-backend/usage-api/add-member/)
- GET /api/2.0/people/{userId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-profile-by-user-id/)
- PUT /api/2.0/people/{userId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-member/)
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

// Step 1: Create a new user
async function createUser(firstName, lastName, email) {
  const url = `${API_HOST}/api/2.0/people`;
  const res = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ firstName, lastName, email }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.log(`User creation failed. Status code: ${res.status}, Message: ${t}`);
    return null;
  }

  const json = await res.json();
  const userId = json?.response?.id;
  console.log(`User created successfully: ${userId}`);
  return userId;
}

// Step 2: Retrieve a user by ID
async function getUser(userId) {
  const url = `${API_HOST}/api/2.0/people/${userId}`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });

  if (!res.ok) {
    const t = await res.text();
    console.log(`User retrieval failed. Status code: ${res.status}, Message: ${t}`);
    return null;
  }

  const userData = await res.json();
  console.log('User retrieved:', userData);
  return userData;
}

// Step 3: Update user role
async function updateUserRole(userId, role) {
  const url = `${API_HOST}/api/2.0/people/${userId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.log(`User role update failed. Status code: ${res.status}, Message: ${t}`);
    return null;
  }

  console.log(`User ${userId} role updated to ${role}`);
}

// Run
(async () => {
  const userId = await createUser('John', 'Doe', 'john.doe@example.com');

  if (userId) {
    await getUser(userId);
    await updateUserRole(userId, 'Manager');
  }
})();
