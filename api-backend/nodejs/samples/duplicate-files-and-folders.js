/*
Example: Duplicate files and folders

This example demonstrates how to duplicate one or more files and folders in ONLYOFFICE DocSpace using the API. 
The duplicated items will appear in the same location with a modified title.

Using methods:
- PUT /api/2.0/files/fileops/duplicate (https://api.onlyoffice.com/docspace/api-backend/usage-api/duplicate-batch-items/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// File and folder IDs to duplicate
const FILE_IDS = [111111, 222222];
const FOLDER_IDS = [333333, 444444];

// Step 1: Duplicate specified files and folders
function duplicateFilesAndFolders(fileIds, folderIds) {
  const url = `${API_HOST}/api/2.0/files/fileops/duplicate`;
  const data = {
    fileIds: fileIds,
    folderIds: folderIds,
  };

  return fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      if (res.status === 200) return res.json();
      const text = await res.text();
      console.log(`Duplication failed. Status code: ${res.status}, Message: ${text}`);
      return null;
    })
    .catch(() => null);
}

// Run
duplicateFilesAndFolders(FILE_IDS, FOLDER_IDS);
