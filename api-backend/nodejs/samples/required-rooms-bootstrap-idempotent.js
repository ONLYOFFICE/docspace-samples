/*
Example: Required rooms bootstrap (idempotent)

This example demonstrates idempotent bootstrap of required rooms:
1) Find room by title candidates,
2) Create if missing,
3) Ensure required subfolders exist.

Using methods:
- GET /api/2.0/files/rooms (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-rooms/)
- POST /api/2.0/files/rooms (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-room/)
- GET /api/2.0/files/{folderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-folder-by-id/)
- POST /api/2.0/files/folder/{parentFolderId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-folder/)
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

async function listRooms() {
  const payload = await apiRequest("/api/2.0/files/rooms");
  return Array.isArray(payload?.folders) ? payload.folders : Array.isArray(payload) ? payload : [];
}

async function findRoomByCandidates(candidates) {
  const rooms = await listRooms();
  const normalized = (candidates || []).map((x) => String(x || "").trim().toLowerCase()).filter(Boolean);

  for (const candidate of normalized) {
    const exact = rooms.find((x) => String(x?.title || x?.name || "").trim().toLowerCase() === candidate);
    if (exact) return exact;
  }

  for (const candidate of normalized) {
    const includes = rooms.find((x) => String(x?.title || x?.name || "").trim().toLowerCase().includes(candidate));
    if (includes) return includes;
  }

  return null;
}

async function createRoom(title, roomType = 1) {
  return apiRequest("/api/2.0/files/rooms", {
    method: "POST",
    body: { title, roomType }
  });
}

async function listSubfolders(folderId) {
  const payload = await apiRequest(`/api/2.0/files/${encodeURIComponent(folderId)}`);
  return Array.isArray(payload?.folders) ? payload.folders : [];
}

async function ensureFolder(parentFolderId, title) {
  const subfolders = await listSubfolders(parentFolderId);
  const normalized = String(title || "").trim().toLowerCase();
  const existing = subfolders.find((x) => String(x?.title || "").trim().toLowerCase() === normalized) || null;
  if (existing?.id) return existing;

  return apiRequest(`/api/2.0/files/folder/${encodeURIComponent(parentFolderId)}`, {
    method: "POST",
    body: { title }
  });
}

async function bootstrapRequiredRooms() {
  const required = [
    {
      title: "Projects Templates",
      candidates: ["Projects Templates", "Project Templates"],
      roomType: 1,
      folders: ["Templates"]
    },
    {
      title: "Template library",
      candidates: ["Template library", "Templates room", "Drafts"],
      roomType: 2,
      folders: ["Templates"]
    }
  ];

  const results = [];
  for (const def of required) {
    // eslint-disable-next-line no-await-in-loop
    let room = await findRoomByCandidates(def.candidates);
    let created = false;
    if (!room?.id) {
      // eslint-disable-next-line no-await-in-loop
      room = await createRoom(def.title, def.roomType);
      created = true;
    }

    const roomId = String(room?.id || room?.response?.id || "");
    const ensuredFolders = [];
    for (const folderTitle of def.folders || []) {
      // eslint-disable-next-line no-await-in-loop
      const folder = await ensureFolder(roomId, folderTitle);
      if (folder?.id) ensuredFolders.push({ id: folder.id, title: folder.title || folderTitle });
    }

    results.push({
      title: def.title,
      roomId,
      created,
      folders: ensuredFolders
    });
  }

  return results;
}

bootstrapRequiredRooms()
  .then((result) => {
    console.log("Bootstrap result:", result);
  })
  .catch((err) => {
    console.error(err?.message || err);
  });

