/*
Example: Ephemeral demo users and room cleanup

This example demonstrates safe demo environment lifecycle:
1) Create temporary users,
2) Create temporary room and share access,
3) Cleanup: terminate users, delete users, delete room.

Using methods:
- POST /api/2.0/people (https://api.onlyoffice.com/docspace/api-backend/usage-api/add-member/)
- POST /api/2.0/files/rooms (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-room/)
- PUT /api/2.0/files/rooms/{roomId}/share (https://api.onlyoffice.com/docspace/api-backend/usage-api/share-room/)
- PUT /api/2.0/people/status/Terminated (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-user-status/)
- DELETE /api/2.0/people/{userId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-member/)
- DELETE /api/2.0/files/rooms/{roomId} (https://api.onlyoffice.com/docspace/api-backend/usage-api/delete-room/)
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

async function createUser(firstName, lastName, email) {
  return apiRequest("/api/2.0/people", {
    method: "POST",
    body: { firstName, lastName, email }
  });
}

async function createRoom(title) {
  return apiRequest("/api/2.0/files/rooms", {
    method: "POST",
    body: { title, roomType: 1 }
  });
}

async function shareRoom(roomId, invitations) {
  return apiRequest(`/api/2.0/files/rooms/${encodeURIComponent(roomId)}/share`, {
    method: "PUT",
    body: { invitations, notify: false }
  });
}

async function terminateUsers(userIds) {
  return apiRequest("/api/2.0/people/status/Terminated", {
    method: "PUT",
    body: { userIds }
  });
}

async function deleteUser(userId) {
  return apiRequest(`/api/2.0/people/${encodeURIComponent(userId)}`, { method: "DELETE" });
}

async function deleteRoom(roomId) {
  return apiRequest(`/api/2.0/files/rooms/${encodeURIComponent(roomId)}`, { method: "DELETE" });
}

async function runDemoLifecycle() {
  const createdUserIds = [];
  let createdRoomId = null;

  try {
    const requester = await createUser("Demo", "Requester", "demo.requester@example.com");
    const recipient = await createUser("Demo", "Recipient", "demo.recipient@example.com");

    if (!requester?.id || !recipient?.id) {
      console.log("Failed to create demo users.");
      return;
    }

    createdUserIds.push(String(requester.id), String(recipient.id));
    console.log("Created users:", createdUserIds);

    const room = await createRoom("Demo Approval Room");
    createdRoomId = String(room?.id || room?.response?.id || "");
    if (!createdRoomId) {
      console.log("Failed to create demo room.");
      return;
    }

    await shareRoom(createdRoomId, [
      { id: String(requester.id), access: "ContentCreator" },
      { id: String(recipient.id), access: "FillForms" }
    ]);
    console.log("Demo room shared:", createdRoomId);
  } finally {
    if (createdUserIds.length) {
      await terminateUsers(createdUserIds);
      for (const userId of createdUserIds) {
        // eslint-disable-next-line no-await-in-loop
        await deleteUser(userId);
      }
      console.log("Demo users cleaned up.");
    }

    if (createdRoomId) {
      await deleteRoom(createdRoomId);
      console.log("Demo room cleaned up.");
    }
  }
}

runDemoLifecycle().catch((err) => {
  console.error(err?.message || err);
});

