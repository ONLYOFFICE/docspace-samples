// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Create a text file in a folder
function createTextFile(folderId, title, content) {
  const url = `${API_HOST}/api/2.0/files/${folderId}/text`;
  const data = {
    title: title,
    content: content,
  };

  return fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (res.status === 200) return res.json();
      return res.text().then((t) => {
        console.log(`File creation failed. Status code: ${res.status}, Message: ${t}`);
        return null;
      });
    })
    .then((fileInfo) => {
      if (!fileInfo) return null;
      console.log('File created successfully:', fileInfo);
      return fileInfo;
    })
    .catch((err) => {
      console.log(`File creation error: ${err.message}`);
      return null;
    });
}

// Run
const folderId = '123456'; // Replace with your target folder ID
const title = 'ExampleFile.txt'; // Desired file name
const content = 'This is the content of the example text file.'; // File content

console.log('\nCreating a text file with specified content:');
createTextFile(folderId, title, content);
