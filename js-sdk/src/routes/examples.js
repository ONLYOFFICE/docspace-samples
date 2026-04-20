'use strict';
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { getConfig }    = require('../config');
const sessionStore     = require('../sessionStore');

const router   = express.Router();
const ROOT_DIR = path.resolve(__dirname, '../../');
const SAMPLE_DIRS = [
  path.join(ROOT_DIR, 'basic-samples'),
  path.join(ROOT_DIR, 'advanced-samples'),
].map(dir => path.resolve(dir));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMeta(html, metaName) {
  const re = new RegExp(
    `<meta\\s+[^>]*name\\s*=\\s*["']${metaName}["'][^>]*content\\s*=\\s*["']([^"']+)["'][^>]*>`,
    'i'
  );
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Parse "Using methods:" block from the top HTML comment.
 * Returns [{text, url}] for each "- MethodName (https://...)" line.
 */
function extractApiLinks(html) {
  const m = html.match(/<!--([\s\S]*?)-->/);
  if (!m) return [];
  const block   = m[1];
  const start   = block.indexOf('Using methods:');
  if (start === -1) return [];
  const section = block.slice(start);
  const re      = /^[- ]+(.+?)\s+\((https?:\/\/[^)]+)\)/gm;
  const links   = [];
  let match;
  while ((match = re.exec(section)) !== null) {
    links.push({ text: match[1].trim(), url: match[2].trim() });
  }
  return links;
}

/**
 * Build the fixed top banner HTML + inline styles.
 */
function buildBanner(title, description, apiLinks, homeUrl) {
  const apiInner = apiLinks.map(l =>
    `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" class="sdk-b-chip">${esc(l.text)}</a>`
  ).join('');

  const apiSection = apiLinks.length
    ? `<div class="sdk-b-api"><span class="sdk-b-api-lbl">API:</span>${apiInner}</div>`
    : '';

  const style = `
<style>
#sdk-banner{position:fixed;top:0;left:0;right:0;z-index:9999;display:flex;align-items:center;gap:16px;padding:0 24px;background:#fff;border-bottom:1px solid #e6e6e6;box-shadow:0 1px 4px rgba(0,0,0,.08);font-family:"Segoe UI",Tahoma,Geneva,Verdana,sans-serif;box-sizing:border-box;}
.sdk-b-back{display:inline-flex;align-items:center;gap:5px;color:#6b7280;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0;}
.sdk-b-back:hover{color:#111;}
.sdk-b-sep{width:1px;align-self:stretch;margin:10px 0;background:#e6e6e6;flex-shrink:0;}
.sdk-b-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;padding:12px 0;}
.sdk-b-title{font-size:15px;font-weight:700;color:#111;}
.sdk-b-desc{font-size:13px;color:#4b5563;}
.sdk-b-api{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;}
.sdk-b-api-lbl{color:#6b7280;font-size:11px;font-weight:700;white-space:nowrap;text-transform:uppercase;letter-spacing:.05em;}
.sdk-b-chip{display:inline-flex;align-items:center;padding:3px 10px;border:1px solid rgba(0,100,210,.35);border-radius:999px;background:rgba(0,100,210,.08);color:#0058c7;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;transition:background .15s,border-color .15s;}
.sdk-b-chip:hover{background:rgba(0,100,210,.15);border-color:rgba(0,100,210,.5);}
</style>
<script>
(function(){
  function applyPad(){
    var b=document.getElementById('sdk-banner');
    if(b){
      var h=b.offsetHeight+16;
      document.body.style.paddingTop=h+'px';
      document.documentElement.style.setProperty('--sdk-banner-h',h+'px');
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyPad);
  else applyPad();
  window.addEventListener('resize',applyPad);
})();
</script>`;

  const html = `
<div id="sdk-banner">
  <a href="${esc(homeUrl)}" class="sdk-b-back">&#8592; Examples</a>
  <div class="sdk-b-sep"></div>
  <div class="sdk-b-info">
    <span class="sdk-b-title">${esc(title)}</span>
    ${description ? `<span class="sdk-b-desc">${esc(description)}</span>` : ''}
    ${apiSection}
  </div>
</div>`;

  return { style, html };
}

function parseOrder(value) {
  const raw = String(value || '').trim();
  if (!raw) return 9999;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 9999;
}

function walkHtmlFiles(dir) {
  const htmlFiles = [];
  if (!fs.existsSync(dir)) return htmlFiles;
  const walk = currentDir => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) htmlFiles.push(fullPath);
    }
  };
  walk(dir);
  return htmlFiles;
}

function toWebPath(abs) {
  return '/' + path.relative(ROOT_DIR, abs).replace(/\\/g, '/');
}

function isPathInside(parentDir, targetPath) {
  const rel = path.relative(parentDir, targetPath);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function resolveExamplePath(fileParam) {
  const rel = String(fileParam || '').trim().replace(/^\/+/, '');
  if (!rel || !rel.toLowerCase().endsWith('.html')) return null;

  const abs = path.resolve(ROOT_DIR, rel);
  if (!SAMPLE_DIRS.some(dir => isPathInside(dir, abs))) return null;

  return abs;
}

function normalizePortalSrc(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return '';
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
  return parsed.toString().replace(/\/+$/, '');
}

// ─── GET /api/config  (public, no secrets) ────────────────────────────────────

router.get('/api/config', (_req, res) => {
  const config = getConfig();
  res.json({
    demoEnabled:       config.demoEnabled,
    allowCustomPortal: config.allowCustomPortal,
    hasPortalSrc:      Boolean(config.portalSrc),
    // portalSrc is needed client-side only to load api.js for the login frame
    // it is already visible in the browser via SDK script src anyway
    portalSrc:         config.portalSrc || null,
  });
});

// ─── GET /api/examples ────────────────────────────────────────────────────────

router.get('/api/examples', (_req, res) => {
  try {
    const dirs = [
      { dir: path.join(ROOT_DIR, 'basic-samples'),    group: 'basic'    },
      { dir: path.join(ROOT_DIR, 'advanced-samples'), group: 'advanced' },
    ];

    const examples = [];
    for (const { dir, group } of dirs) {
      for (const absolutePath of walkHtmlFiles(dir)) {
        const webPath = toWebPath(absolutePath);
        if (webPath === '/index.html') continue;
        const html        = fs.readFileSync(absolutePath, 'utf8');
        if (extractMeta(html, 'example-hidden') === 'true') continue;
        const name        = extractMeta(html, 'example-title') ||
                            html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ||
                            'Untitled';
        const description = extractMeta(html, 'example-description') || '';
        const metaGroup   = extractMeta(html, 'example-group') || group;
        const metaOrder   = parseOrder(extractMeta(html, 'example-order'));

        examples.push({
          name,
          description,
          group:      metaGroup.toLowerCase(),
          order:      metaOrder,
          sourceFile: webPath,
          file:       `/example?file=${encodeURIComponent(webPath)}`,
        });
      }
    }

    examples.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      if (a.order !== b.order) return a.order - b.order;
      return a.name.localeCompare(b.name);
    });
    res.json(examples);
  } catch (error) {
    console.error('[examples] list error:', error);
    res.status(500).json({ error: 'Failed to list examples' });
  }
});

// ─── GET /example  (serves HTML with injected config + session) ───────────────

router.get('/example', (req, res) => {
  try {
    const config = getConfig();

    const fileParam = String(req.query.file || '').trim();
    if (!fileParam) return res.status(400).send('Missing ?file= parameter');

    const absolutePath = resolveExamplePath(fileParam);
    if (!absolutePath) return res.status(400).send('Invalid example path');
    if (!fs.existsSync(absolutePath)) return res.status(404).send('Example not found');

    // Custom portal mode: ?portalSrc= overrides the server env
    const portalSrc = normalizePortalSrc(req.query.portalSrc || config.portalSrc);

    if (!portalSrc) return res.status(400).send(
      'Portal URL is invalid or not configured. Set PORTAL_SRC in .env or pass a valid http(s) ?portalSrc= URL.'
    );

    // Resolve active session (if any)
    const sessionId = sessionStore.getSessionId(req);
    const session = sessionId ? sessionStore.get(sessionId) : null;
    const active  = session && !sessionStore.isExpired(session) ? session : null;
    if (active) sessionStore.touch(active);

    // Build replacement map for {PLACEHOLDER} tokens in HTML
    const vars = {
      PORTAL_SRC:           portalSrc,
      DEMO_ROOM_ID:         active ? String(active.roomId         || '') : '',
      DEMO_FILE_DOCX:       active ? String(active.files?.docx    || '') : '',
      DEMO_FILE_XLSX:       active ? String(active.files?.xlsx    || '') : '',
      DEMO_FILE_PPTX:       active ? String(active.files?.pptx    || '') : '',
      DEMO_FILE_PDF_FORM:   active ? String(active.files?.pdfForm || '') : '',
      DEMO_FILE_PDF_TEMPLATE: active ? String(active.files?.pdfTemplate || '') : '',
      DEMO_USER_EMAIL:      active ? String(active.userEmail    || '') : '',
      DEMO_USER_PASSWORD:   active ? String(active.userPassword || '') : '',
    };

    let html = fs.readFileSync(absolutePath, 'utf8');

    // Replace {VAR} tokens
    for (const [key, val] of Object.entries(vars)) {
      html = html.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    }

    // Inject window.__demoConfig so demo-init.js can pre-fill inputs
    const demoConfig = active
      ? {
          active: true,
          session: {
            roomId: active.roomId || null,
            files: {
              docx:        active.files?.docx        || null,
              xlsx:        active.files?.xlsx        || null,
              pptx:        active.files?.pptx        || null,
              pdfForm:     active.files?.pdfForm     || null,
              pdfTemplate: active.files?.pdfTemplate || null,
            },
            user: {
              email:    active.userEmail    || null,
              password: active.userPassword || null,
            },
          },
        }
      : { active: false };

    // Build and inject example header banner
    const exTitle   = extractMeta(html, 'example-title') || path.basename(absolutePath, '.html');
    const exDesc    = extractMeta(html, 'example-description') || '';
    const apiLinks  = extractApiLinks(html);
    const homeUrl   = `${req.protocol}://${req.get('host')}/`;
    const banner    = buildBanner(exTitle, exDesc, apiLinks, homeUrl);

    const trackScript = active
      ? `window.__demoTrack=function(t,i){if(!i)return;fetch('/api/demo/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:t,id:String(i)})}).catch(function(){});};`
      : `window.__demoTrack=function(){};`;

    html = html.replace(
      '</head>',
      `${banner.style}\n<script>window.__demoConfig = ${JSON.stringify(demoConfig)};${trackScript}</script>\n</head>`
    );
    html = html.replace(/(<body[^>]*>)/, `$1\n${banner.html}`);

    // Inject demo-init.js (auto-fills inputs from __demoConfig)
    html = html.replace('</body>', '<script src="/assets/js/demo-init.js"></script>\n</body>');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('[example] render error:', error);
    res.status(500).send('Failed to render example');
  }
});

module.exports = router;
