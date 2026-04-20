'use strict';
const { getConfig } = require('./config');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function makeError(message, status, details) {
  const err = new Error(String(message || 'Unknown error'));
  if (status)  err.status  = status;
  if (details) err.details = details;
  return err;
}

function logClientWarning(scope, error, details) {
  const suffix = error?.message || String(error || 'Unknown error');
  if (details) {
    console.warn(`[docspace-client] ${scope}: ${suffix}`, details);
    return;
  }
  console.warn(`[docspace-client] ${scope}: ${suffix}`);
}

// ─── Core HTTP request ────────────────────────────────────────────────────────

async function apiRequest(urlPath, { method = 'GET', body, auth } = {}) {
  const config = getConfig();
  const portalSrc = config.portalSrc;
  const rawAuthorization = String(auth || config.adminApiKey || '').trim();
  // Prefix with "Bearer" if not already prefixed (DocSpace PAT requires it)
  const authorization = rawAuthorization && !/\s/.test(rawAuthorization) ? `Bearer ${rawAuthorization}` : rawAuthorization;

  if (!portalSrc)     throw makeError('PORTAL_SRC is not configured');
  if (!authorization) throw makeError('No API key configured (ADMIN_API_KEY)');

  const response = await fetch(`${portalSrc}${urlPath}`, {
    method,
    headers: {
      ...(body != null ? { 'Content-Type': 'application/json' } : {}),
      Authorization: authorization,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const text = await response.text().catch(() => '');
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!response.ok) {
    const message =
      (typeof data?.error?.message === 'string' && data.error.message) ||
      (typeof data?.error   === 'string' && data.error)   ||
      (typeof data?.message === 'string' && data.message) ||
      data?.raw || response.statusText;
    throw makeError(message, response.status, data);
  }
  return data?.response ?? data;
}

// ─── Async file-operation wait ────────────────────────────────────────────────

async function waitFileOp(opId, { timeoutMs = 25000, intervalMs = 800 } = {}) {
  if (!opId) return;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    let operations;
    try {
      operations = await apiRequest('/api/2.0/files/fileops');
    } catch (err) {
      logClientWarning(`waitFileOp(${opId}) poll failed`, err);
      break;
    }
    // apiRequest returns data.response already; fileops returns an array directly
    const operationList = Array.isArray(operations) ? operations : [];
    const entry = operationList.find(operation => String(operation?.id ?? operation?.operationId ?? '') === String(opId));
    if (!entry) return; // completed ops are removed from list
    const done = Boolean(entry.finished) || Number(entry.progress ?? entry.percents ?? 0) >= 100;
    if (done) {
      if (entry.error) throw makeError(entry.error, undefined, entry);
      return;
    }
    await sleep(intervalMs);
  }
  console.warn(`[docspace-client] waitFileOp(${opId}) did not confirm completion within ${timeoutMs}ms`);
}

// ─── Authentication ───────────────────────────────────────────────────────────

async function authenticateUser(userName, password) {
  const config = getConfig();
  const response = await fetch(`${config.portalSrc}/api/2.0/authentication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.error || data?.message || response.statusText;
    throw makeError(message, response.status, data);
  }
  const token = data?.response?.token;
  if (!token) throw makeError('No token in authentication response');
  return token;
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function createUser({ email, password, firstName, lastName, type = 'User', isUser = true }) {
  return apiRequest('/api/2.0/people', {
    method: 'POST',
    body: {
      email,
      password,
      type,
      isUser,
      firstName: firstName || email.split('@')[0] || 'Demo',
      lastName:  lastName  || 'User',
    },
  });
}

async function terminateUser(userId) {
  return apiRequest('/api/2.0/people/status/Terminated', {
    method: 'PUT',
    body: { userIds: [String(userId)] },
  });
}

async function deleteUser(userId) {
  const id = String(userId || '').trim();
  if (!id) throw makeError('userId is required');
  try {
    return await apiRequest(`/api/2.0/people/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (error) {
    // DocSpace may auto-delete the user on terminate — 404 is fine
    if (error.status === 404) return { ok: true };
    throw error;
  }
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

async function createRoom(title, roomType = 2) {
  // roomType 2 = Editing room (most permissive for demos)
  return apiRequest('/api/2.0/files/rooms', {
    method: 'POST',
    body: { title, roomType },
  });
}

async function shareRoomWithUser(roomId, userId, access = 'Editing') {
  // String access values match official API examples and are explicit.
  return apiRequest(`/api/2.0/files/rooms/${encodeURIComponent(String(roomId))}/share`, {
    method: 'PUT',
    body: { invitations: [{ id: String(userId), access }], notify: false },
  });
}

async function archiveRoom(roomId) {
  return apiRequest(`/api/2.0/files/rooms/${encodeURIComponent(String(roomId))}/archive`, {
    method: 'PUT',
    body: {},
  });
}

async function deleteRoom(roomId) {
  const rid = String(roomId || '').trim();
  if (!rid) return;
  await archiveRoom(rid).catch(err => {
    logClientWarning(`archiveRoom(${rid}) before delete`, err);
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await apiRequest(`/api/2.0/files/rooms/${encodeURIComponent(rid)}`, {
        method: 'DELETE',
        body: {},
      });
    } catch (err) {
      if (err.status === 404) return { ok: true };
      if (err.status === 400 && attempt < 2) { await sleep(500 * (attempt + 1)); continue; }
      throw err;
    }
  }
}

// ─── Files ────────────────────────────────────────────────────────────────────

async function getFileInfo(fileId) {
  return apiRequest(`/api/2.0/files/file/${encodeURIComponent(String(fileId))}`);
}

async function getFolderFiles(folderId) {
  // apiRequest already unwraps data.response, so `data` here IS the response object
  const data = await apiRequest(`/api/2.0/files/${encodeURIComponent(String(folderId))}`);
  if (Array.isArray(data?.files))  return data.files;
  if (Array.isArray(data?.items))  return data.items.filter(i => i.fileExst || i.isFile);
  return [];
}

/**
 * Copy template files into a room and return a map of { templateFileId → copiedFileId }.
 * Uses title-matching to identify the new files after the async copy completes.
 */
async function copyTemplatesToRoom(templateFileIds, destRoomId) {
  const ids = templateFileIds.filter(Boolean).map(String);
  if (!ids.length) return {};

  // Fetch template file titles so we can match them after copy
  const infoResults = await Promise.allSettled(ids.map(id => getFileInfo(id)));
  const titleById = {};
  infoResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      titleById[ids[index]] = String(result.value.title || '');
    }
  });

  // Snapshot destination folder before copy
  const before = await getFolderFiles(destRoomId).catch(() => []);
  const beforeIds = new Set(before.map(f => String(f.id)));

  // Start copy operation
  // Response is an array of operation objects: [{id, finished, progress, ...}]
  const opList = await apiRequest('/api/2.0/files/fileops/copy', {
    method: 'PUT',
    body: {
      fileIds: ids,
      destFolderId: String(destRoomId),
      deleteAfter: false,
      content: true,
    },
  });
  const op = Array.isArray(opList) ? opList[0] : opList;

  // Wait for async completion
  const opId = String(op?.id ?? op?.operationId ?? '');
  if (opId && !op?.finished) {
    await waitFileOp(opId).catch(err => {
      logClientWarning(`copyTemplatesToRoom(${destRoomId}) wait failed`, err, { opId, templateFileIds: ids });
    });
  }

  // Snapshot after copy, find new files
  const after = await getFolderFiles(destRoomId).catch(() => []);
  const newFiles = after.filter(f => !beforeIds.has(String(f.id)));

  // Build title → new ID map
  const titleToNewId = {};
  newFiles.forEach(file => { titleToNewId[String(file.title || '')] = String(file.id); });

  // Map original template ID → copied file ID
  const result = {};
  for (const origId of ids) {
    const title = titleById[origId];
    if (title && titleToNewId[title]) result[origId] = titleToNewId[title];
  }
  return result;
}

async function deleteFile(fileId) {
  const id = String(fileId || '').trim();
  if (!id) return;
  try {
    const opList = await apiRequest('/api/2.0/files/fileops/delete', {
      method: 'PUT',
      body: { fileIds: [id], folderIds: [], deleteAfter: true, immediately: true },
    });
    const op = Array.isArray(opList) ? opList[0] : opList;
    const opId = String(op?.id ?? op?.operationId ?? '');
    if (opId && !op?.finished) {
      await waitFileOp(opId).catch(err => {
        logClientWarning(`deleteFile(${id}) wait failed`, err, { opId });
      });
    }
  } catch (error) {
    if (error?.status === 404) return;
    throw error;
  }
}

async function deleteFolder(folderId) {
  const id = String(folderId || '').trim();
  if (!id) return;
  try {
    const opList = await apiRequest('/api/2.0/files/fileops/delete', {
      method: 'PUT',
      body: { fileIds: [], folderIds: [id], deleteAfter: true, immediately: true },
    });
    const op = Array.isArray(opList) ? opList[0] : opList;
    const opId = String(op?.id ?? op?.operationId ?? '');
    if (opId && !op?.finished) {
      await waitFileOp(opId).catch(err => {
        logClientWarning(`deleteFolder(${id}) wait failed`, err, { opId });
      });
    }
  } catch (error) {
    if (error?.status === 404) return;
    throw error;
  }
}

module.exports = {
  apiRequest,
  authenticateUser,
  createUser,
  terminateUser,
  deleteUser,
  createRoom,
  deleteRoom,
  shareRoomWithUser,
  getFileInfo,
  getFolderFiles,
  copyTemplatesToRoom,
  deleteFile,
  deleteFolder,
};
