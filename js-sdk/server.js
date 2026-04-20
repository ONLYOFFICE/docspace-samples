'use strict';
const express  = require('express');
const path     = require('path');
const http     = require('http');

const { getConfig }                 = require('./src/config');   // also loads .env
const sessionStore                  = require('./src/sessionStore');
const examplesRouter                = require('./src/routes/examples');
const { router: demoRouter, cleanupSession } = require('./src/routes/demo');

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// ─── Session middleware ───────────────────────────────────────────────────────
// Attaches active session to req.demoSession; evicts expired sessions inline.

app.use((req, _res, next) => {
  const sessionId = sessionStore.getSessionId(req);
  const session   = sessionId ? sessionStore.get(sessionId) : null;
  if (session) {
    if (sessionStore.isExpired(session)) {
      sessionStore.remove(session.id);
      cleanupSession(session).catch(err => {
        console.warn(`[server] cleanup failed for expired session ${session.id}:`, err?.message || err);
      });
      req.demoSession = null;
    } else {
      req.demoSession = session;
      sessionStore.touch(session);
    }
  } else {
    req.demoSession = null;
  }
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use(examplesRouter);
app.use('/api/demo', demoRouter);

// ─── Legacy proxy endpoints (used by some examples) ──────────────────────────

app.post('/api/authenticate', async (req, res) => {
  const config = getConfig();
  if (!config.portalSrc) return res.status(400).json({ error: 'PORTAL_SRC is not set' });

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  try {
    const response = await fetch(`${config.portalSrc}/api/2.0/authentication`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ userName: username, password }),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Authentication failed',
        details: json?.error?.message || json?.message || response.statusText,
      });
    }
    const token = json?.response?.token;
    if (!token) return res.status(502).json({ error: 'No token in authentication response' });
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ error: 'Authentication error', details: error?.message });
  }
});

app.post('/api/create-public-share-link', async (req, res) => {
  const config = getConfig();
  if (!config.portalSrc)   return res.status(400).json({ error: 'PORTAL_SRC is not set' });
  if (!config.adminApiKey) return res.status(400).json({ error: 'ADMIN_API_KEY is not set' });

  const sessionId = sessionStore.getSessionId(req);
  const session   = sessionId ? sessionStore.get(sessionId) : null;
  if (!session || sessionStore.isExpired(session)) {
    return res.status(401).json({ error: 'Active demo session required' });
  }

  const fileId = _extractId(req.body);
  if (!fileId) return res.status(400).json({ error: 'fileId is required' });

  // Verify the fileId belongs to this session's resources.
  // Allow only IDs that were explicitly placed in the session (template copies + user-created files).
  // If the session has no tracked files at all, we cannot restrict (e.g. no templates configured).
  const sessionFileIds = new Set([
    ...Object.values(session.files || {}).map(id => String(id || '').trim()).filter(Boolean),
    ...(session.userCreated?.files || []).map(id => String(id).trim()).filter(Boolean),
  ]);
  if (sessionFileIds.size > 0 && !sessionFileIds.has(fileId)) {
    return res.status(403).json({ error: 'fileId does not belong to the current demo session' });
  }

  try {
    const accessFallback = ['Read', 'ReadWrite', 'FillForms'];
    let response = null;
    let text = '';
    let json = null;
    let usedAccess = '';
    let lastFailure = null;

    for (const access of accessFallback) {
      response = await fetch(`${config.portalSrc}/api/2.0/files/file/${fileId}/links`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${config.adminApiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ access, internal: false, primary: true }),
      });
      text = await response.text();
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }

      if (response.ok) {
        usedAccess = access;
        break;
      }

      const roleMismatch = /role is not available for this user type/i.test(text || '');
      lastFailure = { status: response.status, text, access };

      // Retry only for known role mismatch 403; fail fast otherwise.
      if (!(response.status === 403 && roleMismatch)) {
        return res.status(response.status).json({ error: 'Failed to create link', details: text, access });
      }
    }

    if (!response || !response.ok) {
      return res.status(lastFailure?.status || 403).json({
        error: 'Failed to create link',
        details: lastFailure?.text || 'Unknown link creation error',
        accessTried: accessFallback,
      });
    }

    const link = _pickPublicLink(json?.response ?? json);
    if (!link?.shareLink) {
      return res.status(502).json({ error: 'Share link not found in response', details: json });
    }
    res.json({
      success: true,
      fileId,
      access: usedAccess || accessFallback[0],
      shareLink: link.shareLink,
      requestToken: link.requestToken || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Unexpected error', details: error?.message });
  }
});

function _extractId(obj, depth = 4) {
  if (!obj || depth < 0) return '';
  if (typeof obj !== 'object') return '';
  const direct = obj.id ?? obj.fileId ?? obj.fileID ?? obj.itemId;
  if (direct != null && String(direct).trim()) return String(direct).trim();
  for (const key of ['data', 'response', 'result', 'item', 'file']) {
    if (obj[key] && typeof obj[key] === 'object') {
      const found = _extractId(obj[key], depth - 1);
      if (found) return found;
    }
  }
  return '';
}

function _pickPublicLink(links) {
  const list = Array.isArray(links) ? links : (links ? [links] : []);
  const normalized = list.map(item => {
    const s = item?.sharedLink || item?.sharedTo || item || {};
    return { shareLink: s?.shareLink || item?.shareLink || null, requestToken: s?.requestToken || null, internal: item?.internal, primary: item?.primary };
  });
  return (
    normalized.find(l => l.primary && l.internal === false && l.shareLink) ||
    normalized.find(l => l.internal === false && l.shareLink) ||
    normalized.find(l => l.shareLink) || null
  );
}

// ─── Static files ─────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname)));

// ─── Startup ──────────────────────────────────────────────────────────────────

async function listenOnAvailablePort(server, preferredPort, maxAttempts = 10) {
  let lastErr = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const port = preferredPort + attempt;
    const result = await new Promise(resolve => {
      const onListening = () => {
        server.off('error', onError);
        resolve({ ok: true, port });
      };
      const onError = err => {
        server.off('listening', onListening);
        resolve({ ok: false, err });
      };
      server.once('listening', onListening);
      server.once('error', onError);
      server.listen(port);
    });
    if (result.ok) return result.port;
    lastErr = result.err;
    if (result.err?.code !== 'EADDRINUSE') throw result.err;
  }
  throw lastErr || new Error('Failed to bind server port');
}

async function start() {
  await sessionStore.hydrate();

  // Clean up stale sessions that survived a server restart
  const stale = sessionStore.list().filter(session => sessionStore.isExpired(session));
  if (stale.length) {
    console.log(`[server] cleaning ${stale.length} stale session(s) from disk...`);
    for (const session of stale) {
      await cleanupSession(session).catch(error => {
        console.warn(`[server] stale session cleanup failed for ${session.id}:`, error?.message || error);
      });
      sessionStore.remove(session.id);
    }
    await sessionStore.flush();
  }

  // Background janitor evicts sessions that expire while server runs
  sessionStore.startJanitor(async (session) => {
    await cleanupSession(session);
  });

  // Graceful shutdown — clean up all active sessions before exit
  const shutdown = async signal => {
    console.log(`[server] ${signal} — shutting down...`);
    try {
      for (const session of sessionStore.list()) {
        await cleanupSession(session).catch(error => {
          console.warn(`[server] shutdown cleanup failed for ${session.id}:`, error?.message || error);
        });
      }
      await sessionStore.flush();
    } catch (error) {
      console.warn('[server] shutdown error:', error?.message);
    }
    process.exit(0);
  };
  process.on('SIGINT',  () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  const config = getConfig();
  const server = http.createServer(app);
  const actualPort = await listenOnAvailablePort(server, config.port);
  if (actualPort !== config.port) {
    console.warn(`[server] port ${config.port} is busy, switched to ${actualPort}`);
  }
  console.log(`[server] http://localhost:${actualPort}`);
  console.log(`[server] demo mode:      ${config.demoEnabled       ? 'enabled'  : 'disabled (set ADMIN_API_KEY)'}`);
  console.log(`[server] custom portal:  ${config.allowCustomPortal ? 'allowed'  : 'disabled'}`);
  if (config.demoEnabled) {
    console.log(`[server] portal:         ${config.portalSrc}`);
    const templates = config.templates;
    const configured = [templates.docx, templates.xlsx, templates.pptx, templates.pdfForm, templates.pdfTemplate].filter(Boolean).length;
    console.log(`[server] template files: ${configured}/5 configured`);
  }
  server.on('error', err => {
    console.error('[server] error:', err);
    process.exit(1);
  });
}

start().catch(error => { console.error('[server] failed to start:', error); process.exit(1); });
