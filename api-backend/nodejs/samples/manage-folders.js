// Set API base URL
const BASE_URL = 'https://yourportal.onlyoffice.com';
const API_KEY = 'YOUR_API_KEY';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Step 1: Create a folder
function createFolder(parentFolderId, folderName) {
  const url = `${BASE_URL}/api/2.0/files/folder/${parentFolderId}`;
  const data = { title: folderName };
  return fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(data) })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Folder creation failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`Folder creation error: ${err.message}`);
      return null;
    });
}

// Step 2: Retrieve folder details
function getFolderDetails(folderId) {
  const url = `${BASE_URL}/api/2.0/files/folder/${folderId}`;
  return fetch(url, { method: 'GET', headers: HEADERS })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Folder details retrieval failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`Folder details retrieval error: ${err.message}`);
      return null;
    });
}

// Step 3: Rename a folder
function renameFolder(folderId, newName) {
  const url = `${BASE_URL}/api/2.0/files/folder/${folderId}/rename`;
  const data = { title: newName };
  return fetch(url, { method: 'PUT', headers: HEADERS, body: JSON.stringify(data) })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Folder rename failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`Folder rename error: ${err.message}`);
      return null;
    });
}

// Step 4: Delete a folder
function deleteFolder(folderId) {
  const url = `${BASE_URL}/api/2.0/files/folder/${folderId}`;
  return fetch(url, { method: 'DELETE', headers: HEADERS })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Folder deletion failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch((err) => {
      console.log(`Folder deletion error: ${err.message}`);
      return null;
    });
}

async function main() {
  const parent_folder_id = 1234;
  const folder_id = 1234;
  const folder_name = 'New Folder';
  const new_folder_name = 'Updated Folder Name';

  const created = await createFolder(parent_folder_id, folder_name);
  if (!created) return;

  const details = await getFolderDetails(folder_id);
  if (!details) return;

  const renamed = await renameFolder(folder_id, new_folder_name);
  if (!renamed) return;

  await deleteFolder(folder_id);
}

main();
