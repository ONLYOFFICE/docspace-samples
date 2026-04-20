'use strict';
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { getConfig } = require('./config');

// ─── In-memory store ──────────────────────────────────────────────────────────

const sessions = new Map();
let _janitorTimer  = null;
let _persistTimer  = null;
let _persistChain  = Promise.resolve();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now() { return Date.now(); }
function getSessionConfig() { return getConfig().session; }
function ttlMs()  { return getSessionConfig().ttlMinutes  * 60 * 1000; }
function idleMs() { return getSessionConfig().idleMinutes * 60 * 1000; }
function storePath() { return path.resolve(process.cwd(), getSessionConfig().storePath); }

// ─── Expiry ───────────────────────────────────────────────────────────────────

function isExpired(session, ts = now()) {
  if (!session) return true;
  if (ts - session.createdAt  > ttlMs())  return true;
  if (ts - session.lastSeenAt > idleMs()) return true;
  return false;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

async function _writeSnapshot() {
  const snapshotPath = storePath();
  // Serialize without credentials — only structural info for restart recovery
  const snapshot = {
    v: 1,
    updatedAt: new Date().toISOString(),
    sessions: Array.from(sessions.values()).map(s => ({
      id:          s.id,
      createdAt:   s.createdAt,
      lastSeenAt:  s.lastSeenAt,
      userId:      s.userId  || null,
      roomId:      s.roomId  || null,
      files:       s.files   || {},
      userCreated: s.userCreated || { rooms: [], files: [], folders: [] },
      // userEmail / userPassword intentionally NOT persisted
    })),
  };
  try {
    await fs.promises.mkdir(path.dirname(snapshotPath), { recursive: true });
    await fs.promises.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');
  } catch (error) {
    console.warn('[session-store] persist failed:', error?.message || error);
  }
}

function _schedulePersist() {
  if (_persistTimer) return;
  _persistTimer = setTimeout(() => {
    _persistTimer = null;
    _persistChain = _persistChain.catch(() => null).then(() => _writeSnapshot());
  }, 200);
  _persistTimer.unref?.();
}

async function hydrate() {
  const snapshotPath = storePath();
  try {
    const rawSnapshot  = await fs.promises.readFile(snapshotPath, 'utf8');
    const snapshot = JSON.parse(rawSnapshot);
    if (Array.isArray(snapshot?.sessions)) {
      snapshot.sessions.forEach(savedSession => {
        if (savedSession?.id) sessions.set(savedSession.id, {
          id:         savedSession.id,
          createdAt:  Number(savedSession.createdAt)  || now(),
          lastSeenAt: Number(savedSession.lastSeenAt) || now(),
          userId:      savedSession.userId  || null,
          roomId:      savedSession.roomId  || null,
          files:       savedSession.files   || {},
          userCreated: savedSession.userCreated || { rooms: [], files: [], folders: [] },
          // credentials not restored — expired sessions will be cleaned up at startup
        });
      });
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') console.warn('[session-store] hydrate failed:', error?.message || error);
  }
}

async function flush() {
  if (_persistTimer) { clearTimeout(_persistTimer); _persistTimer = null; }
  await _persistChain.catch(() => null);
  await _writeSnapshot();
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

function create(data) {
  const id  = randomUUID();
  const ts  = now();
  const session = { id, createdAt: ts, lastSeenAt: ts, ...data };
  sessions.set(id, session);
  _schedulePersist();
  return session;
}

function get(id) {
  return sessions.get(String(id || '')) || null;
}

function remove(id) {
  const deleted = sessions.delete(String(id || ''));
  if (deleted) _schedulePersist();
  return deleted;
}

function list() {
  return Array.from(sessions.values());
}

function touch(session) {
  if (!session) return;
  session.lastSeenAt = now();
  _schedulePersist();
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function _parseCookies(header) {
  const parsedCookies = {};
  String(header || '').split(';').forEach(part => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex < 0) return;
    const cookieName = part.slice(0, separatorIndex).trim();
    const cookieValue = part.slice(separatorIndex + 1).trim();
    if (!cookieName) return;
    try { parsedCookies[cookieName] = decodeURIComponent(cookieValue); }
    catch { parsedCookies[cookieName] = cookieValue; }
  });
  return parsedCookies;
}

function getSessionId(req) {
  const cookies = _parseCookies(req.headers?.cookie);
  return String(cookies[getSessionConfig().cookieName] || '').trim() || null;
}

function setSessionCookie(res, sessionId) {
  const secure = process.env.NODE_ENV === 'production';
  const maxAge = getSessionConfig().ttlMinutes * 60;
  const parts  = [
    `${getSessionConfig().cookieName}=${encodeURIComponent(sessionId)}`,
    'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`,
    ...(secure ? ['Secure'] : []),
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production';
  const parts  = [
    `${getSessionConfig().cookieName}=`,
    'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0',
    ...(secure ? ['Secure'] : []),
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

// ─── Janitor ──────────────────────────────────────────────────────────────────

function startJanitor(onExpire) {
  if (_janitorTimer) return;
  const intervalMs = Math.max(10000, getSessionConfig().janitorIntervalSeconds * 1000);
  _janitorTimer = setInterval(async () => {
    const ts      = now();
    const expired = list().filter(s => isExpired(s, ts));
    for (const session of expired) {
      try   { await onExpire(session); }
      catch (error) { console.warn('[janitor] cleanup error', session.id, error?.message || error); }
      remove(session.id);
    }
  }, intervalMs);
  _janitorTimer.unref?.();
}

module.exports = {
  hydrate, flush,
  create, get, remove, list, touch,
  isExpired,
  getSessionId, setSessionCookie, clearSessionCookie,
  startJanitor,
};
