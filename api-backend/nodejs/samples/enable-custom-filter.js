/*
Example: Enable custom filter mode for a file

This example demonstrates how to enable the Custom Filter mode for a specific file in ONLYOFFICE DocSpace using the API.
The Custom Filter feature allows you to restrict spreadsheet views so that users only see their own applied filters.

Using methods:
- PUT /api/2.0/files/file/{fileId}/customfilter (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-all-permissions/)
*/

// Set your DocSpace portal URL and access token
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';
const FILE_ID = 123456; // Replace with your actual file ID

// Headers with authorization token
const headers = { Authorization: API_KEY };

// Step 1: Enable Custom Filter mode
function enableCustomFilter(fileId) {
  const payload = { enabled: true };

  return fetch(`${API_HOST}/api/2.0/files/file/${fileId}/customfilter`, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`Custom Filter enabling failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((data) => {
      const result = data?.response || {};
      console.log(`Custom Filter enabled for file ID ${fileId}`);
      console.log(`• Title: ${result.title}`);
      console.log(`• View URL: ${result.webUrl || result.viewUrl}`);
      console.log(`• Filter Enabled By: ${result.customFilterEnabledBy}`);
      return result;
    })
    .catch((err) => {
      console.error(err.message);
      return null;
    });
}

// Run the method
console.log('Enabling Custom Filter mode...');
enableCustomFilter(FILE_ID);
