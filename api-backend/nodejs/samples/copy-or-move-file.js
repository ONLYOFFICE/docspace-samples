/*
Example: Copy or move a file to a folder

This example demonstrates how to copy or move a file in ONLYOFFICE DocSpace.

Using methods:
- PUT /api/2.0/files/fileops/copy (https://api.onlyoffice.com/docspace/api-backend/usage-api/copy-batch-items/)
- PUT /api/2.0/files/fileops/move (https://api.onlyoffice.com/docspace/api-backend/usage-api/move-batch-items/)
*/

// Set API base URL
const BASE_URL = "https://yourportal.onlyoffice.com";
const API_KEY = "your_api_key";

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

// Step 1: Copy a file to another folder
function copyFileToFolder(fileId, destFolderId) {
  const url = `${BASE_URL}/api/2.0/files/fileops/copy`;
  const payload = {
    fileIds: [fileId],
    destFolderId: destFolderId,
    deleteAfter: false, // Copy, do not remove original
    content: true,
    toFillOut: false,
  };

  return fetch(url, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (res.status === 200) {
        console.log(`File ${fileId} copied to folder ${destFolderId}`);
      } else {
        return res.text().then((t) => {
          console.log(`Copy failed. Status code: ${res.status}, Message: ${t}`);
        });
      }
    })
    .catch((err) => {
      console.log("Copy failed:");
      console.log(err.message);
    });
}

// Step 2: Move a file to another folder
function moveFileToFolder(fileId, destFolderId) {
  const url = `${BASE_URL}/api/2.0/files/fileops/move`;
  const payload = {
    fileIds: [fileId],
    destFolderId: destFolderId,
    deleteAfter: true, // Move means remove from original
    content: true,
    toFillOut: false,
  };

  return fetch(url, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (res.status === 200) {
        console.log(`File ${fileId} moved to folder ${destFolderId}`);
      } else {
        return res.text().then((t) => {
          console.log(`Move failed. Status code: ${res.status}, Message: ${t}`);
        });
      }
    })
    .catch((err) => {
      console.log("Move failed:");
      console.log(err.message);
    });
}

// Run an example
const fileId = 1568550;        // ID of the file
const destFolderId = 1079053;  // ID of the destination folder

copyFileToFolder(fileId, destFolderId)
  .then(() => moveFileToFolder(fileId, destFolderId));