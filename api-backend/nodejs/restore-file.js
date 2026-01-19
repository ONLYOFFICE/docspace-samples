// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
};

// Step 1: Get file version history
async function getFileVersions(fileId) {
  const url = `${API_HOST}/api/2.0/files/file/${fileId}/edit/history`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });

  if (!res.ok) {
    const text = await res.text();
    console.log(`File versions retrieval failed. Status code: ${res.status}, Message: ${text}`);
    return [];
  }

  const data = await res.json();
  const versions = data?.response ?? [];
  console.log('Available versions:');
  for (const v of versions) {
    console.log(`- Version ${v.version} created at ${v.created}`);
  }
  return versions;
}

// Step 2: Restore file to specific version
async function restoreFileVersion(fileId, versionNumber) {
  const params = new URLSearchParams({ version: String(versionNumber) });
  const url = `${API_HOST}/api/2.0/files/file/${fileId}/restoreversion?${params}`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });

  if (res.ok) {
    console.log(`File restored to version ${versionNumber}`);
  } else {
    const text = await res.text();
    console.log(`Restore to version ${versionNumber} failed. Status code: ${res.status}, Message: ${text}`);
  }
}

// Run the flow
(async () => {
  const file_id = 1569862; // Replace with your file ID
  const versions = await getFileVersions(file_id);

  if (versions && versions.length > 1) {
    const target_version = versions[0].version;
    await restoreFileVersion(file_id, target_version);
  } else {
    console.log('No previous versions available for restore.');
  }
})();
