/*
Example: Manage a guest user

This example demonstrates how to manage a guest user in ONLYOFFICE DocSpace using the API.

The script includes two main operations:

- Approving a guest who was invited via sharing.
- Deleting the guest by their unique ID.

Using methods:
- POST /api/2.0/people/guests/share/approve (https://api.onlyoffice.com/docspace/api-backend/usage-api/approve-guest-share-link/)
- DELETE /api/2.0/people/guests (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-guests/)
*/

// Set your DocSpace portal URL, access token, and guest email
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';
const EMAIL = 'guest@example.com';

// Headers with authorization token
const HEADERS = {
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

// Step 1: Approve a guest invited via share
async function approveGuest(email) {
  const url = `${API_HOST}/api/2.0/people/guests/share/approve`;
  const res = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ email }),
  });

  const raw = await res.text();
  console.log('Status Code:', res.status);
  console.log('Raw Response:', raw);

  if (!res.ok) {
    console.log(`Guest approval failed. Status code: ${res.status}, Message: ${raw}`);
    return null;
  }

  const data = JSON.parse(raw);
  const guest = data?.response ?? {};
  console.log(`Approved guest: ${guest.displayName} (${guest.email})`);
  return String(guest.id);
}

// Step 2: Delete a guest by ID
async function deleteGuest(userId) {
  const url = `${API_HOST}/api/2.0/people/guests`;
  const payload = { userIds: [userId], resendAll: false };

  const res = await fetch(url, {
    method: 'DELETE',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  console.log('Status Code (delete):', res.status);
  console.log('Raw Response (delete):', raw);

  if (!res.ok) {
    console.log(`Guest deletion failed. Status code: ${res.status}, Message: ${raw}`);
    return null;
  }

  console.log(`Guest with ID ${userId} deleted successfully.`);
}

// Run the guest management flow
(async () => {
  try {
    console.log('Approving guest...');
    const guestId = await approveGuest(EMAIL);

    console.log('\nDeleting guest...');
    await deleteGuest(guestId);
  } catch (err) {
    console.error(err.message);
  }
})();
