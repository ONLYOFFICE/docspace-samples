/*
Example: Publish template with operation polling

This example demonstrates a reliable template publish flow:
1) Copy template file into a target Templates folder,
2) Poll file operation status,
3) Detect the created file in destination folder.

Using methods:
- PUT /api/2.0/files/fileops/copy (https://api.onlyoffice.com/docspace/api-backend/usage-api/copy-batch-items/)
- GET /api/2.0/files/fileops (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-operations/)
- GET /api/2.0/files/{folderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-folder-by-id/)
*/

const API_HOST = "https://yourportal.onlyoffice.com";
const API_KEY = "your_api_key";

const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json"
};

function unwrapResponse(data) {
  return data && typeof data === "object" && "response" in data ? data.response : data;
}

function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function apiRequest(path, { method = "GET", body } = {}) {
  const res = await fetchWithTimeout(`${API_HOST}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status !== 200) {
    const text = await res.text();
    throw new Error(`${method} ${path} failed with status ${res.status}: ${text}`);
  }

  const data = await res.json().catch(() => ({}));
  return unwrapResponse(data);
}

async function listFolderItems(folderId) {
  const data = await apiRequest(`/api/2.0/files/${encodeURIComponent(folderId)}`);
  return Array.isArray(data?.files) ? data.files : [];
}

async function listOperations() {
  const data = await apiRequest("/api/2.0/files/fileops");
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function pickOperation(ops, operationId) {
  return (ops || []).find((x) => String(x?.id || x?.operationId || "") === String(operationId || "")) || null;
}

async function waitForOperation(operationId, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    const ops = await listOperations();
    const op = pickOperation(ops, operationId);
    if (!op) return true;

    const finished = Boolean(op?.finished) || Number(op?.progress || op?.percentage || 0) >= 100;
    if (finished) return true;

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  return false;
}

async function publishTemplate({ templateFileId, templatesFolderId }) {
  const before = await listFolderItems(templatesFolderId);
  const beforeIds = new Set(before.map((x) => String(x.id)));

  const op = await apiRequest("/api/2.0/files/fileops/copy", {
    method: "PUT",
    body: {
      fileIds: [String(templateFileId)],
      destFolderId: String(templatesFolderId),
      deleteAfter: false,
      content: true,
      toFillOut: false
    }
  });
  const operationId = String(op?.id || op?.operationId || "");
  if (!operationId) {
    throw new Error("Operation ID was not returned by the copy API.");
  }

  const completed = await waitForOperation(operationId);
  if (!completed) {
    throw new Error("Copy operation timed out before completing.");
  }

  const after = await listFolderItems(templatesFolderId);
  const created = after.find((x) => !beforeIds.has(String(x.id))) || null;
  return created;
}

(async () => {
  const templateFileId = "123456"; // Replace with template file ID
  const templatesFolderId = "654321"; // Replace with destination Templates folder ID

  try {
    const created = await publishTemplate({ templateFileId, templatesFolderId });
    if (!created?.id) {
      console.log("Template publish completed, but created file was not detected.");
      return;
    }

    console.log("Published file:", {
      id: created.id,
      title: created.title || null,
      fileExst: created.fileExst || null
    });
  } catch (err) {
    console.error("Template publish failed:", err.message);
  }
})();
