// Set your DocSpace portal URL and API key
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';
const GROUP_ID = '08e455dc-98c4-4390-b36f-54757080149c'; // Replace with your actual group ID

// Headers with API key
const headers = {
  Authorization: API_KEY,
};

// Step 1: Get group by ID with members included
function getGroupWithMembers(groupId) {
  const params = new URLSearchParams({ includeMembers: 'True' });
  const url = `${API_HOST}/api/2.0/group/${groupId}?${params.toString()}`;

  return fetch(url, { method: 'GET', headers })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Group retrieval failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      const group = data?.response || {};
      console.log(`Group: ${group.name}`);
      console.log('Members:');
      (group.members || []).forEach((m) => {
        console.log(`- ${m.id} — ${m.displayName}`);
      });
      return group;
    })
    .catch((err) => {
      console.log(`Group retrieval error: ${err.message}`);
      return null;
    });
}

// Run the method
console.log('Getting group with members...');
getGroupWithMembers(GROUP_ID);
