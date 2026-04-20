/*
Example: Staged approval with recipient levels

This example demonstrates a practical staged approval flow:
1) Create/get a fill-out link for one template file,
2) Share project room access only with the current stage,
3) Move to the next stage after manual confirmation.

Using methods:
- GET /api/2.0/files/file/{fileId}/links (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-file-links/)
- PUT /api/2.0/files/file/{fileId}/links (https://api.onlyoffice.com/docspace/api-backend/usage-api/set-file-external-link/)
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

async function getOrCreateFillOutLink(fileId) {
  const links = await apiRequest(`/api/2.0/files/file/${encodeURIComponent(fileId)}/links`);
  if (Array.isArray(links)) {
    const fillOut = links.find((x) => String(x?.title || "").toLowerCase().includes("fill out"));
    if (fillOut?.shareLink) return fillOut;
  }

  return apiRequest(`/api/2.0/files/file/${encodeURIComponent(fileId)}/links`, {
    method: "PUT",
    body: {
      access: "FillForms",
      internal: false,
      primary: true,
      title: "Link to fill out"
    }
  });
}

async function shareRoomForStage(roomId, emails, access = "FillForms") {
  const invitations = (emails || [])
    .map((email) => String(email || "").trim().toLowerCase())
    .filter(Boolean)
    .map((email) => ({ email, access }));

  if (!invitations.length) return null;

  return apiRequest(`/api/2.0/files/rooms/${encodeURIComponent(roomId)}/share`, {
    method: "PUT",
    body: {
      invitations,
      notify: false
    }
  });
}

async function runStagedApproval() {
  const roomId = "123456"; // Replace with your project room ID
  const templateFileId = "654321"; // Replace with your template file ID

  const recipientLevels = [
    ["legal.approver@example.com"],
    ["finance.approver@example.com", "director@example.com"]
  ];

  const link = await getOrCreateFillOutLink(templateFileId);
  if (!link?.shareLink) {
    console.log("Unable to get fill-out link.");
    return;
  }

  console.log("Shared approval link:", link.shareLink);
  console.log("Stage 1 recipients:", recipientLevels[0]);

  const stage1Share = await shareRoomForStage(roomId, recipientLevels[0], "FillForms");
  console.log("Stage 1 room share result:", stage1Share);

  console.log("After stage 1 is completed, start stage 2.");
  const stage2Share = await shareRoomForStage(roomId, recipientLevels[1], "FillForms");
  console.log("Stage 2 room share result:", stage2Share);
}

runStagedApproval().catch((err) => {
  console.error(err?.message || err);
});

