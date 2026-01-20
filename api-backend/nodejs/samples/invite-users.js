// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Create users with emails and return user data
function createUsers(users) {
  const url = `${API_HOST}/api/2.0/people`;

  const requests = users.map((user) => {
    const data = {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    };

    return fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(data) })
      .then((res) => {
        if (res.status === 200) return res.json();
        return res.text().then((t) => {
          console.log(`User creation failed for ${user.email}. Status code: ${res.status}, Message: ${t}`);
          return null;
        });
      })
      .then((json) => {
        if (!json) return null;
        const userData = json.response;
        console.log('User created successfully:', userData);
        return userData;
      })
      .catch((err) => {
        console.log(`User creation error for ${user.email}: ${err.message}`);
        return null;
      });
  });

  return Promise.all(requests).then((results) => results.filter(Boolean));
}

// Step 2: Send invitations to newly created users
function sendInvitations(users) {
  const url = `${API_HOST}/api/2.0/people/invite`;
  const data = {
    invitations: users.map((user) => ({ email: user.email, type: 'All' })),
  };

  return fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(data) })
    .then((res) => {
      if (res.status === 200) {
        console.log('Invitations sent successfully to users.');
      } else {
        return res.text().then((t) => {
          console.log(`Invitations send failed. Status code: ${res.status}, Message: ${t}`);
        });
      }
    })
    .catch((err) => {
      console.log(`Invitations send error: ${err.message}`);
    });
}

// Run
const users = [
  // Enter your email for testing
  { first_name: 'Alice', last_name: 'Smith', email: 'alice.smith@example.com' },
  { first_name: 'Bob', last_name: 'Johnson', email: 'bob.johnson@example.com' },
];

// Step 1: Create new users and get their data
createUsers(users).then((createdUsers) => {
  // Step 2: Send invitations to newly created users
  if (createdUsers && createdUsers.length) {
    sendInvitations(createdUsers);
  }
});
