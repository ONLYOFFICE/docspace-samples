'use strict';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function parseEnvInt(key, defaultValue) {
  const raw = process.env[key];
  if (raw == null || raw === '') return defaultValue;
  const parsedValue = parseInt(raw, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : defaultValue;
}

function getConfig() {
  const portalSrc = String(process.env.PORTAL_SRC || '').trim().replace(/\/+$/, '');
  const adminApiKey =
    String(process.env.ADMIN_API_KEY || '').trim() ||
    String(process.env.API_KEY || '').trim() ||
    String(process.env.DOCSPACE_API_KEY || '').trim();

  return {
    portalSrc,
    adminApiKey,
    port: parseEnvInt('PORT', 3030),
    // demo requires both portal URL and an API key
    demoEnabled: Boolean(portalSrc && adminApiKey),
    // show "use your own portal" option unless explicitly disabled
    allowCustomPortal: String(process.env.ALLOW_CUSTOM_PORTAL || 'true').toLowerCase() !== 'false',

    session: {
      ttlMinutes:              parseEnvInt('DEMO_SESSION_TTL_MINUTES', 30),
      idleMinutes:             parseEnvInt('DEMO_SESSION_IDLE_MINUTES', 15),
      janitorIntervalSeconds:  parseEnvInt('DEMO_SESSION_JANITOR_INTERVAL_SECONDS', 60),
      cookieName:  String(process.env.DEMO_COOKIE_NAME  || 'sdk_demo_sid').trim(),
      storePath:   String(process.env.DEMO_SESSION_STORE_PATH || '.data/sessions.json').trim(),
      emailDomain: String(process.env.DEMO_EMAIL_DOMAIN || 'demo.local').trim().replace(/^@+/, ''),
      rateLimit: {
        max:      parseEnvInt('DEMO_RATE_LIMIT_MAX', 3),
        windowMs: parseEnvInt('DEMO_RATE_LIMIT_WINDOW_SECONDS', 60) * 1000,
      },
    },

    // IDs of template files to copy into each session's room
    templates: {
      roomId:      String(process.env.TEMPLATE_ROOM_ID           || '').trim(),
      docx:        String(process.env.TEMPLATE_FILE_DOCX         || '').trim(),
      xlsx:        String(process.env.TEMPLATE_FILE_XLSX         || '').trim(),
      pptx:        String(process.env.TEMPLATE_FILE_PPTX         || '').trim(),
      pdfForm:     String(process.env.TEMPLATE_FILE_PDF_FORM     || '').trim(),
      pdfTemplate: String(process.env.TEMPLATE_FILE_PDF_TEMPLATE || '').trim(),
    },
  };
}

module.exports = { getConfig };
