/*
Example: Shared sign for a single document and multiple recipients

This example demonstrates a useful shared-sign scenario:
1) Create one document copy in a signing room,
2) Start filling for that copy,
3) Share room access to recipients in stages.

Using methods:
- PUT /api/2.0/files/fileops/copy (https://api.onlyoffice.com/docspace/api-backend/usage-api/copy-batch-items/)
- PUT /api/2.0/files/file/{fileId}/startfilling (https://api.onlyoffice.com/docspace/api-backend/usage-api/start-filling-file/)
- PUT /api/2.0/files/rooms/{roomId}/share (https://api.onlyoffice.com/docspace/api-backend/usage-api/share-room/)
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

async function listFolderFiles(folderId) {
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

async function createSingleDocumentInstance(templateFileId, destinationFolderId) {
  const before = await listFolderFiles(destinationFolderId);
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

  const after = await listFolderFiles(destinationFolderId);
  const created = after.find((x) => !beforeIds.has(String(x.id))) || null;
  return created?.id ? String(created.id) : null;
}

async function startFilling(fileId) {
  return apiRequest(`/api/2.0/files/file/${encodeURIComponent(fileId)}/startfilling`, { method: "PUT" });
}

async function shareStage(roomId, emails) {
  const invitations = (emails || [])
    .map((x) => String(x || "").trim().toLowerCase())
    .filter(Boolean)
    .map((email) => ({ email, access: "ReadWrite" }));

  if (!invitations.length) return null;

  return apiRequest(`/api/2.0/files/rooms/${encodeURIComponent(roomId)}/share`, {
    method: "PUT",
    body: {
      invitations,
      notify: false
    }
  });
}

async function runSharedSignFlow() {
  const signingRoomId = "123456"; // Replace with your signing room ID
  const contractsFolderId = "123456"; // Replace with your destination folder ID in signing room
  const templateFileId = "654321"; // Replace with your template file ID

  const stage1 = ["signer.one@example.com"];
  const stage2 = ["signer.two@example.com", "signer.three@example.com"];

  const sharedFileId = await createSingleDocumentInstance(templateFileId, contractsFolderId);
  if (!sharedFileId) {
    console.log("Unable to create a document instance.");
    return;
  }

  console.log("Created shared document file ID:", sharedFileId);
  await startFilling(sharedFileId);
  console.log("Filling mode enabled for shared document.");

  await shareStage(signingRoomId, stage1);
  console.log("Stage 1 shared to:", stage1);

  console.log("After stage 1 signing completion, sharing stage 2.");
  await shareStage(signingRoomId, stage2);
  console.log("Stage 2 shared to:", stage2);
}

runSharedSignFlow().catch((err) => {
  console.error(err?.message || err);
});

