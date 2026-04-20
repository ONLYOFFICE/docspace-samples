/*
Example: Bulk approval links from one template

This example demonstrates how to generate multiple approval links:
1) Create N file copies from one template,
2) Generate external fill-out link for each copy,
3) Print links for distribution.

Using methods:
- PUT /api/2.0/files/fileops/copy (https://api.onlyoffice.com/docspace/api-backend/usage-api/copy-batch-items/)
- GET /api/2.0/files/{folderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-folder-by-id/)
- PUT /api/2.0/files/file/{fileId}/links (https://api.onlyoffice.com/docspace/api-backend/usage-api/set-file-external-link/)
*/

const API_HOST = "https://yourportal.onlyoffice.com";
const API_KEY = "your_api_key";

const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json"
};

function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function unwrapResponse(data) {
  return data && typeof data === "object" && "response" in data ? data.response : data;
}

async function apiRequest(path, { method = "GET", body } = {}) {
  const res = await fetchWithTimeout(`${API_HOST}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status !== 200) {
    const text = await res.text();
    console.log(`Request failed. ${method} ${path}. Status: ${res.status}, Message: ${text}`);
    return null;
  }

  const data = await res.json().catch(() => ({}));
  return unwrapResponse(data);
}

async function listFiles(folderId) {
  const payload = await apiRequest(`/api/2.0/files/${encodeURIComponent(folderId)}`);
  return Array.isArray(payload?.files) ? payload.files : [];
}

async function listOperations() {
  const data = await apiRequest("/api/2.0/files/fileops");
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

async function waitForOperation(operationId, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    const ops = await listOperations();
    const op = ops.find((x) => String(x?.id || x?.operationId || "") === String(operationId));
    if (!op) return true;
    const finished = Boolean(op?.finished) || Number(op?.progress || op?.percentage || 0) >= 100;
    if (finished) return true;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  return false;
}

async function copyTemplateOnce(templateFileId, destinationFolderId) {
  const before = await listFiles(destinationFolderId);
  const beforeIds = new Set(before.map((x) => String(x.id)));

  const op = await apiRequest("/api/2.0/files/fileops/copy", {
    method: "PUT",
    body: {
      fileIds: [String(templateFileId)],
      destFolderId: String(destinationFolderId),
      deleteAfter: false,
      content: true,
      toFillOut: false
    }
  });

  const operationId = String(op?.id || op?.operationId || "");
  if (operationId) {
    await waitForOperation(operationId);
  }

  const after = await listFiles(destinationFolderId);
  const created = after.find((x) => !beforeIds.has(String(x.id))) || null;
  return created?.id ? String(created.id) : null;
}

async function createFillOutLink(fileId) {
  return apiRequest(`/api/2.0/files/file/${encodeURIComponent(fileId)}/links`, {
    method: "PUT",
    body: {
      access: "FillForms",
      internal: false,
      primary: true,
      title: "Approval link"
    }
  });
}

async function runBulkLinks() {
  const templateFileId = "123456"; // Replace with template file ID
  const destinationFolderId = "654321"; // Replace with destination folder ID
  const count = 10; // Replace with number of links you need

  const links = [];
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const fileId = await copyTemplateOnce(templateFileId, destinationFolderId);
    if (!fileId) continue;

    // eslint-disable-next-line no-await-in-loop
    const link = await createFillOutLink(fileId);
    const shareLink = String(link?.shareLink || "").trim();
    if (shareLink) links.push({ fileId, shareLink });
  }

  console.log("Generated links:", links.length);
  links.forEach((x, index) => {
    console.log(`${index + 1}. fileId=${x.fileId} link=${x.shareLink}`);
  });
}

runBulkLinks().catch((err) => {
  console.error(err?.message || err);
});

