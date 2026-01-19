import { exec } from "child_process";

// Set API base URL
const API_HOST = "https://yourportal.onlyoffice.com";
const API_KEY = "your_api_key";

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

// Helper: open URL in default browser (no external deps)
function openInBrowser(url) {
  const platform = process.platform;
  const cmd =
    platform === "win32"
      ? `start "" "${url}"`
      : platform === "darwin"
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd);
}

// Step 1: Create a new file in a folder and open it
function createFile(folderId, fileTitle) {
  const url = `${API_HOST}/api/2.0/files/${folderId}/file`;
  const data = { title: fileTitle, type: "text" };

  return fetch(url, {
    method: "POST",
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
  .then((json) => {
    if (!json) return null;
    const fileInfo = json.response || {};
    const editUrl = fileInfo.webUrl;
    if (editUrl) openInBrowser(editUrl); // Open document in default browser
    return fileInfo;
  })
  .catch((err) => {
    console.log(`File creation error: ${err.message}`);
    return null;
  });
}

// Run
const folderId = "123456"; // Replace with your actual folder ID
const fileTitle = "NewDocument.docx";

createFile(folderId, fileTitle);
