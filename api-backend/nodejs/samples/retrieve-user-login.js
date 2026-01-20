// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Retrieve the most recent login audit events
async function getLastLoginEvents() {
  const url = `${API_HOST}/api/2.0/security/audit/login/last`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });

  if (!res.ok) {
    const text = await res.text();
    console.log(`Login events retrieval failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  const loginEvents = await res.json();
  console.log('Last login events retrieved successfully:', loginEvents);
  return loginEvents;
}

// Step 2: Retrieve login events using filters
async function getLoginEventsByFilter({ userId = null, action = null, startDate = null, endDate = null } = {}) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (action !== null && action !== undefined) params.set('action', String(action)); // 0=login, 1=logout
  if (startDate) params.set('from', startDate);
  if (endDate) params.set('to', endDate);

  const url = `${API_HOST}/api/2.0/security/audit/login/filter${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });

  if (!res.ok) {
    const text = await res.text();
    console.log(`Filtered login events retrieval failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  const filteredEvents = await res.json();
  console.log('Filtered login events retrieved successfully:', filteredEvents);
  return filteredEvents;
}

// Example usage
(async () => {
  console.log('\nRetrieving the most recent login events:');
  await getLastLoginEvents();

  const user_id = 'user_id_here'; // Replace with actual user ID
  const action = 0;               // 0 = login, 1 = logout
  const start_date = '2025-01-01';
  const end_date = '2025-12-31';

  console.log(`\nRetrieving login events for user ID ${user_id} from ${start_date} to ${end_date}:`);
  await getLoginEventsByFilter({
    userId: user_id,
    action,
    startDate: start_date,
    endDate: end_date,
  });
})();
