// Set API base URL
const API_HOST = 'yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const headers = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: 'application/json',
};

// Step 1: Retrieve folder or room contents
function getFolderContents(folderId) {
  const url = `https://${API_HOST}/api/2.0/files/${folderId}`;

  return fetch(url, { method: 'GET', headers: headers })
    .then((res) =>
      res.text().then((text) => ({ status: res.status, text }))
    )
    .then(({ status, text }) => {
      console.log('Status Code:', status);
      console.log('Raw Response:', text);

      try {
        const data = JSON.parse(text);

        if (data && typeof data === 'object' && 'response' in data) {
          const contents = data.response;
          const files = contents.files || [];
          const folders = contents.folders || [];

          console.log(`\nContents of Folder ID ${folderId}:`);

          console.log('\nFiles:');
          files.forEach((file) => {
            const title = file.title ?? 'No Title';
            const ext = file.fileExst ?? 'Unknown Extension';
            const size = file.contentLength ?? 'Unknown Size';
            console.log(`- ${title} (${ext}) — ${size}`);
          });

          console.log('\nFolders:');
          folders.forEach((folder) => {
            const title = folder.title ?? 'No Title';
            console.log(`- ${title}`);
          });

          return contents;
        } else {
          console.log('Unexpected response format:', data);
          return null;
        }
      } catch (e) {
        console.log(`Error parsing JSON: ${e.message}`);
        console.log('Raw response:', text);
        return null;
      }
    })
    .catch((err) => {
      console.log(`Request failed: ${err.message}`);
      return null;
      });
}

// Run
const folder_id = 1074098; // Replace with actual folder or room ID
getFolderContents(folder_id);
