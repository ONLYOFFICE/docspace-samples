// Set your DocSpace portal URL and API key
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key
const HEADERS = {
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
};

// Step 1: Get groups managed by a specific user
function getManagedGroups(managerId) {
  const params = new URLSearchParams({
    manager: 'True',       // return groups where the given user is a manager
    userId: managerId,     // manager's UUID
  });

  const url = `${API_HOST}/api/2.0/group?${params.toString()}`;

  return fetch(url, { method: 'GET', headers: HEADERS })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Managed groups retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      const groups = data?.response || [];
      console.log(`Found ${groups.length} group(s) managed by ${managerId}:`);
      groups.forEach((g) => {
        console.log(`- ${g.id} — ${g.name}`);
      });
      return groups;
    })
    .catch((err) => {
      console.log(`Managed groups retrieval error: ${err.message}`);
      return null;
    });
}

// Run the method
getManagedGroups('4c65a238-ca50-4374-b904-0d51d4c1822b'); // Replace with manager UUID
