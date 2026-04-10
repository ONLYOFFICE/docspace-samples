/*
Example: Get a list of room templates

This example demonstrates how to retrieve the list of room templates available in ONLYOFFICE DocSpace using the API.
Templates are returned as folders from the Templates area, so the integration can display them in an external UI or select one for later room creation.

Using methods:
- GET /api/2.0/files/rooms?searchArea=Templates (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-rooms-folder/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: 'application/json',
};

// Step 1: Get room templates list
async function getRoomTemplates() {
  const url = `${API_HOST}/api/2.0/files/rooms?searchArea=Templates`;

  const res = await fetch(url, {
    method: 'GET',
    headers: HEADERS,
  });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Templates request failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  return res.json();
}

// Run
(async () => {
  try {
    const data = await getRoomTemplates();
    const templates = Array.isArray(data?.response?.folders) ? data.response.folders : [];

    if (!templates.length) {
      console.log('Templates: []');
      return;
    }

    console.log('Templates:');
    templates.forEach((template) => {
      console.log(`- ID: ${template.id}, Title: ${template.title}`);
    });
  } catch (err) {
    console.error(err?.message || err);
  }
})();
