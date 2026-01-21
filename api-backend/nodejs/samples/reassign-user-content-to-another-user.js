/*
Example: Reassign a user’s content to another user

This example demonstrates how to reassign a user’s data to another user in ONLYOFFICE DocSpace via the API:
check if reassignment is required, start the reassignment, monitor progress, and optionally terminate the task.

Using methods:
- GET /api/2.0/people/reassign/necessary (https://api.onlyoffice.com/docspace/api-backend/usage-api/necessary-reassign/)
- POST /api/2.0/people/reassign/start (https://api.onlyoffice.com/docspace/api-backend/usage-api/start-reassign/)
- GET /api/2.0/people/reassign/progress/{userId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-reassign-progress/)
- PUT /api/2.0/people/reassign/terminate (https://api.onlyoffice.com/docspace/api-backend/usage-api/terminate-reassign/)
*/

// Config
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

const HEADERS = {
  Accept: 'application/json',
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Step 1: Check if reassignment is necessary
async function checkReassignmentNeeded(userId, targetType = 'User') {
  const params = new URLSearchParams({ UserId: userId, Type: targetType });
  const res = await fetch(`${API_HOST}/api/2.0/people/reassign/necessary?${params}`, {
    method: 'GET',
    headers: HEADERS,
  });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Failed to check reassignment: ${res.status} - ${text}`);
    return false;
  }
  const data = await res.json();
  const necessary = data?.response ?? false;
  console.log(`Reassignment required: ${necessary}`);
  return necessary;
}

// Step 2: Start reassignment process
async function startReassignment(fromUserId, toUserId, deleteProfile = false) {
  const payload = { fromUserId, toUserId, deleteProfile };
  const res = await fetch(`${API_HOST}/api/2.0/people/reassign/start`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Failed to start reassignment: ${res.status} - ${text}`);
    return;
  }
  console.log('Reassignment started.');
}

// Step 3: Monitor progress
async function getProgress(userId) {
  while (true) {
    const res = await fetch(`${API_HOST}/api/2.0/people/reassign/progress/${userId}`, {
      method: 'GET',
      headers: HEADERS,
    });
    if (!res.ok) {
      const text = await res.text();
      console.log(`Failed to get progress: ${res.status} - ${text}`);
      break;
    }
    const data = await res.json();
    const info = data?.response || {};
    console.log(`Progress: ${info.percentage}%`);
    if (info.isCompleted) {
      console.log('Reassignment completed.');
      break;
    }
    await sleep(2000);
  }
}

// Step 4: Terminate the reassignment
async function terminateReassignment(userId) {
  const res = await fetch(`${API_HOST}/api/2.0/people/reassign/terminate`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.log(`Failed to terminate reassignment: ${res.status} - ${text}`);
    return;
  }
  console.log('Reassignment terminated.');
}

// Run flow
(async () => {
  const from_user_id = 'SOURCE-USER-ID';
  const to_user_id = 'TARGET-USER-ID';

  if (await checkReassignmentNeeded(from_user_id)) {
    await startReassignment(from_user_id, to_user_id, true);
    await getProgress(from_user_id);
    await terminateReassignment(from_user_id);
  }
})();
