'use strict';
const express      = require('express');
const { randomBytes } = require('crypto');
const { getConfig }  = require('../config');
const client         = require('../docspaceClient');
const sessionStore   = require('../sessionStore');

const router = express.Router();

// ─── Rate limiter ─────────────────────────────────────────────────────────────

const _attempts = new Map();

function checkRateLimit(ip) {
  const { max, windowMs } = getConfig().session.rateLimit;
  const nowMs = Date.now();
  const recentAttempts = (_attempts.get(ip) || []).filter(timestamp => nowMs - timestamp < windowMs);
  if (recentAttempts.length >= max) return false;
  recentAttempts.push(nowMs);
  _attempts.set(ip, recentAttempts);
  // Prune stale IPs to prevent unbounded growth
  if (_attempts.size > 2000) {
    for (const [trackedIp, attemptTimestamps] of _attempts) {
      if (attemptTimestamps.every(timestamp => nowMs - timestamp >= windowMs)) _attempts.delete(trackedIp);
    }
  }
  return true;
}

// ─── Random credential generation ────────────────────────────────────────────

const FIRST_NAMES = ['Alex', 'Jordan', 'Morgan', 'Casey', 'Riley', 'Taylor', 'Drew', 'Blake', 'Avery', 'Reese'];
const LAST_NAMES  = ['Johnson', 'Williams', 'Davis', 'Miller', 'Wilson', 'Moore', 'Anderson', 'Thomas', 'Jackson', 'Harris'];

function _securePick(arr) {
  const limit = 256 - (256 % arr.length);
  let randomByte;
  do { randomByte = randomBytes(1)[0]; } while (randomByte >= limit);
  return arr[randomByte % arr.length];
}

function _randomPassword() {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const digits  = '0123456789';
  const special = '!@#$%^&*()-_=+';
  const all     = upper + lower + digits + special;
  const chars   = [_securePick(upper), _securePick(lower), _securePick(digits), _securePick(special)];
  while (chars.length < 16) chars.push(_securePick(all));
  // Fisher-Yates shuffle with secure random
  for (let i = chars.length - 1; i > 0; i--) {
    const limit = 256 - (256 % (i + 1));
    let randomByte;
    do { randomByte = randomBytes(1)[0]; } while (randomByte >= limit);
    [chars[i], chars[randomByte % (i + 1)]] = [chars[randomByte % (i + 1)], chars[i]];
  }
  return chars.join('');
}

function _genUserDetails() {
  const config = getConfig();
  const slug   = randomBytes(4).toString('hex'); // 8-char hex, unique per call
  const domain = config.session.emailDomain;
  return {
    email:     `demo+${slug}@${domain}`,
    password:  _randomPassword(),
    firstName: _securePick(FIRST_NAMES),
    lastName:  _securePick(LAST_NAMES),
  };
}

function _hasAnyDemoFile(files) {
  if (!files || typeof files !== 'object') return false;
  return Object.values(files).some(fileId => String(fileId || '').trim().length > 0);
}

function _sessionIsReady(session, config = getConfig()) {
  if (!session) return false;
  const hasRoom = String(session.roomId || '').trim().length > 0;
  const hasEmail = String(session.userEmail || '').trim().length > 0;
  const hasPassword = String(session.userPassword || '').trim().length > 0;
  const templatesConfigured = [
    config.templates?.docx,
    config.templates?.xlsx,
    config.templates?.pptx,
    config.templates?.pdfForm,
    config.templates?.pdfTemplate,
  ].some(templateId => String(templateId || '').trim().length > 0);
  const hasFile = _hasAnyDemoFile(session.files);
  return hasRoom && hasEmail && hasPassword && (!templatesConfigured || hasFile);
}

// ─── Cleanup helper (also exported for use by server.js janitor) ──────────────

async function cleanupSession(session) {
  if (!session) return { ok: true };
  const warnings = [];

  // Delete user-created resources (rooms, files, folders created via examples)
  const userCreatedResources = session.userCreated || {};
  for (const createdRoomId of (userCreatedResources.rooms || [])) {
    if (String(createdRoomId) === String(session.roomId)) continue; // already handled below
    await client.deleteRoom(createdRoomId).catch(error => {
      warnings.push(`deleteUserRoom(${createdRoomId}): ${error?.message}`);
    });
  }
  for (const createdFileId of (userCreatedResources.files || [])) {
    await client.deleteFile(createdFileId).catch(error => {
      warnings.push(`deleteFile(${createdFileId}): ${error?.message}`);
    });
  }
  for (const createdFolderId of (userCreatedResources.folders || [])) {
    await client.deleteFolder(createdFolderId).catch(error => {
      warnings.push(`deleteFolder(${createdFolderId}): ${error?.message}`);
    });
  }

  // Delete room first (removes all files inside)
  if (session.roomId) {
    await client.deleteRoom(session.roomId).catch(error => {
      warnings.push(`deleteRoom(${session.roomId}): ${error?.message}`);
    });
  }

  // Terminate then delete the user
  if (session.userId) {
    await client.terminateUser(session.userId).catch(err => {
      console.warn(`[demo] terminateUser(${session.userId}) warning:`, err?.message || err);
    }); // best-effort
    await client.deleteUser(session.userId).catch(error => {
      warnings.push(`deleteUser(${session.userId}): ${error?.message}`);
    });
  }

  if (warnings.length) {
    console.warn(`[demo] cleanup warnings for session ${session.id}:`, warnings.join('; '));
  }
  return { ok: true };
}

// ─── GET /api/demo/status ─────────────────────────────────────────────────────

router.get('/status', (req, res) => {
  const sessionId = sessionStore.getSessionId(req);
  const session   = sessionId ? sessionStore.get(sessionId) : null;

  if (!session || sessionStore.isExpired(session)) {
    if (session) {
      sessionStore.remove(session.id);
      cleanupSession(session).catch(err => {
        console.warn(`[demo] cleanup failed for expired session ${session.id}:`, err?.message || err);
      });
    }
    return res.json({ active: false });
  }

  sessionStore.touch(session);
  const config = getConfig();
  const ttlMs  = config.session.ttlMinutes  * 60 * 1000;
  const idleMs = config.session.idleMinutes * 60 * 1000;
  const ready = _sessionIsReady(session, config);

  res.json({
    active: true,
    ready,
    session: {
      roomId:      session.roomId  || null,
      files:       session.files   || {},
      user:        { email: session.userEmail, password: session.userPassword },
      expiresAt:   session.createdAt  + ttlMs,
      idleTimeout: session.lastSeenAt + idleMs,
    },
  });
});

// ─── POST /api/demo/start ─────────────────────────────────────────────────────

router.post('/start', async (req, res) => {
  const config = getConfig();

  if (!config.demoEnabled) {
    return res.status(503).json({ error: 'Demo mode is not configured on this server.' });
  }

  // Rate limit per IP
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many session requests. Please wait a moment.' });
  }

  // Reuse existing active session
  const existingSid = sessionStore.getSessionId(req);
  if (existingSid) {
    const existing = sessionStore.get(existingSid);
    if (existing && !sessionStore.isExpired(existing)) {
      const ready = _sessionIsReady(existing, config);
      if (ready) {
        sessionStore.touch(existing);
        return res.json({
          ok: true, reused: true, ready: true,
          session: {
            roomId: existing.roomId,
            files:  existing.files || {},
            user:   { email: existing.userEmail, password: existing.userPassword },
          },
        });
      }
      sessionStore.remove(existingSid);
      cleanupSession(existing).catch(err => {
        console.warn(`[demo] cleanup failed for stale session ${existing.id}:`, err?.message || err);
      });
    } else if (existing) {
      sessionStore.remove(existingSid);
      cleanupSession(existing).catch(err => {
        console.warn(`[demo] cleanup failed for expired session ${existing.id}:`, err?.message || err);
      });
    }
  }

  const { email, password, firstName, lastName } = _genUserDetails();
  let userId = null;
  let roomId = null;
  const files = {};

  try {
    // 1. Create temp DocSpace user as a regular "User" account
    const user = await client.createUser({
      email,
      password,
      firstName,
      lastName,
      type: 'User',
      isUser: true,
    });
    userId = String(user?.id || user?.userName || '').trim();
    if (!userId) throw new Error('User creation returned no id');
    console.log(`[demo] user created: ${email} (id=${userId})`);

    // 2. Create private editing room
    const roomTitle = `Demo – ${firstName} ${lastName[0]}.`;
    const room = await client.createRoom(roomTitle, 2);
    roomId = String(room?.id || '').trim();
    if (!roomId) throw new Error('Room creation returned no id');
    console.log(`[demo] room created: "${roomTitle}" (id=${roomId})`);

    // 3. Share room with temp user (access="Editing")
    await client.shareRoomWithUser(roomId, userId, 'Editing').catch(error => {
      console.warn('[demo] shareRoom warning:', error?.message);
    });

    // 4. Copy template files into room
    const templates = config.templates;
    const templateIds = [templates.docx, templates.xlsx, templates.pptx, templates.pdfForm, templates.pdfTemplate].filter(Boolean);

    if (templateIds.length) {
      try {
        const copiedTemplates = await client.copyTemplatesToRoom(templateIds, roomId);
        if (templates.docx        && copiedTemplates[templates.docx])        files.docx        = copiedTemplates[templates.docx];
        if (templates.xlsx        && copiedTemplates[templates.xlsx])        files.xlsx        = copiedTemplates[templates.xlsx];
        if (templates.pptx        && copiedTemplates[templates.pptx])        files.pptx        = copiedTemplates[templates.pptx];
        if (templates.pdfForm     && copiedTemplates[templates.pdfForm])     files.pdfForm     = copiedTemplates[templates.pdfForm];
        if (templates.pdfTemplate && copiedTemplates[templates.pdfTemplate]) files.pdfTemplate = copiedTemplates[templates.pdfTemplate];
        console.log(`[demo] copied ${Object.keys(copiedTemplates).length}/${templateIds.length} files → room ${roomId}`);
      } catch (error) {
        console.warn('[demo] file copy warning:', error?.message);
      }
    }

    // 5. Create session record
    const session = sessionStore.create({ userId, userEmail: email, userPassword: password, roomId, files });
    sessionStore.setSessionCookie(res, session.id);

    return res.json({ ok: true, ready: _sessionIsReady(session, config), session: { roomId, files, user: { email, password } } });

  } catch (error) {
    // Partial cleanup
    if (roomId) {
      client.deleteRoom(roomId).catch(err => {
        console.warn(`[demo] rollback deleteRoom(${roomId}) failed:`, err?.message || err);
      });
    }
    if (userId) {
      client.deleteUser(userId).catch(err => {
        console.warn(`[demo] rollback deleteUser(${userId}) failed:`, err?.message || err);
      });
    }
    console.error('[demo] start failed:', error?.message || error);
    return res.status(500).json({
      error:   'Failed to start demo session',
      details: error?.message || String(error),
    });
  }
});

// ─── DELETE /api/demo/end ─────────────────────────────────────────────────────

router.delete('/end', async (req, res) => {
  const sessionId = sessionStore.getSessionId(req);
  sessionStore.clearSessionCookie(res);

  if (!sessionId) return res.json({ ok: true });

  const session = sessionStore.get(sessionId);
  sessionStore.remove(sessionId);

  if (!session) return res.json({ ok: true });

  try {
    await cleanupSession(session);
    res.json({ ok: true });
  } catch (error) {
    console.error('[demo] end cleanup error:', error?.message || error);
    res.json({ ok: true, warning: 'Cleanup encountered errors' });
  }
});

// ─── POST /api/demo/track ─────────────────────────────────────────────────────

router.post('/track', (req, res) => {
  const sessionId = sessionStore.getSessionId(req);
  const session   = sessionId ? sessionStore.get(sessionId) : null;
  if (!session || sessionStore.isExpired(session)) {
    return res.status(401).json({ error: 'No active session' });
  }

  const { type, id } = req.body || {};
  if (!type || !id) return res.status(400).json({ error: 'type and id are required' });

  const keyMap = { room: 'rooms', file: 'files', folder: 'folders' };
  const key = keyMap[type];
  if (!key) return res.status(400).json({ error: 'type must be room, file, or folder' });

  if (!session.userCreated) session.userCreated = { rooms: [], files: [], folders: [] };
  const strId = String(id);
  if (!session.userCreated[key].includes(strId)) {
    session.userCreated[key].push(strId);
    sessionStore.touch(session);
  }

  res.json({ ok: true });
});

module.exports = { router, cleanupSession };
