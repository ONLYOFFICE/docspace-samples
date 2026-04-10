/*
Example: Manage file links

This example demonstrates how to create/update and retrieve external/public links for a file in ONLYOFFICE DocSpace.
It also shows how to extract a share token from the returned share link.

Using methods:
- PUT /api/2.0/files/file/{fileId}/links (https://api.onlyoffice.com/docspace/api-backend/usage-api/set-file-link/)
- GET /api/2.0/files/file/{fileId}/links (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-file-links/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

function unwrapResponse(json) {
  return json && typeof json === 'object' && 'response' in json ? json.response : json;
}

function extractShareToken(shareLink) {
  if (!shareLink) return null;
  try {
    const url = new URL(String(shareLink));
    const param = url.searchParams.get('share');
    if (param) return param;

    const parts = url.pathname.split('/').filter(Boolean);
    const sIndex = parts.indexOf('s');
    return sIndex >= 0 && parts[sIndex + 1] ? parts[sIndex + 1] : null;
  } catch {
    return null;
  }
}

// Step 1: Create/update a file external link
async function setFileLink(fileId, access = 'ReadWrite', title = null) {
  const url = `${API_HOST}/api/2.0/files/file/${fileId}/links`;
  const body = {
    access,
    internal: false,
    primary: true,
  };
  if (title) body.title = title;

  const res = await fetch(url, { method: 'PUT', headers: HEADERS, body: JSON.stringify(body) });
  if (res.status !== 200) {
    const text = await res.text();
    console.error(`File link set failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
  return unwrapResponse(await res.json());
}

// Step 2: Retrieve file links
async function getFileLinks(fileId) {
  const url = `${API_HOST}/api/2.0/files/file/${fileId}/links`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });
  if (res.status !== 200) {
    const text = await res.text();
    console.error(`File links retrieval failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }
  return unwrapResponse(await res.json());
}

function pickExternalPrimaryLink(links) {
  const items = Array.isArray(links)
    ? links
    : links?.links || links?.items || (links && typeof links === 'object' ? [links] : []);
  const list = Array.isArray(items) ? items : [];

  const normalized = list.map((item) => {
    const shared = item?.sharedLink || item?.sharedTo || item || {};
    return {
      shareLink: shared?.shareLink || item?.shareLink || null,
      requestToken: shared?.requestToken || item?.requestToken || null,
      internal: item?.internal,
      primary: item?.primary,
    };
  });

  return (
    normalized.find((item) => item.primary && item.internal === false && item.shareLink) ||
    normalized.find((item) => item.internal === false && item.shareLink) ||
    normalized.find((item) => item.shareLink) ||
    null
  );
}

// Run example
(async () => {
  try {
    const fileId = '123456'; // Replace with your actual file ID

    const setResp = await setFileLink(fileId, 'ReadWrite', 'Public link (ReadWrite)');
    console.log('Link set response:', setResp);

    const links = await getFileLinks(fileId);
    console.log('Links:', links);

    const picked = pickExternalPrimaryLink(links) || pickExternalPrimaryLink(setResp);
    const shareLink = picked?.shareLink || null;
    const requestToken = picked?.requestToken || extractShareToken(shareLink);

    console.log('Picked shareLink:', shareLink);
    console.log('Picked requestToken/shareToken:', requestToken);
  } catch (err) {
    console.error(err?.message || err);
  }
})();
