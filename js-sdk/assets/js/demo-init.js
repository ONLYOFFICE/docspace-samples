/**
 * demo-init.js — auto-fills example inputs from window.__demoConfig.
 * Injected server-side into every /example page when a demo session is active.
 */
(function () {
  const demoConfig = window.__demoConfig;
  if (!demoConfig || !demoConfig.active || !demoConfig.session) return;

  const session     = demoConfig.session;
  const email       = session.user?.email    || '';
  const password    = session.user?.password || '';
  const roomId      = session.roomId ? String(session.roomId) : '';
  const docx        = session.files?.docx        ? String(session.files.docx)        : '';
  const xlsx        = session.files?.xlsx        ? String(session.files.xlsx)        : '';
  const pptx        = session.files?.pptx        ? String(session.files.pptx)        : '';
  const pdfForm     = session.files?.pdfForm     ? String(session.files.pdfForm)     : '';
  const pdfTemplate = session.files?.pdfTemplate ? String(session.files.pdfTemplate) : '';

  // Any available file ID (docx preferred, fallback to others)
  const anyFile = docx || xlsx || pptx || pdfForm || pdfTemplate;

  // Map of input element id → value to pre-fill
  const fillMap = {
    // ── Credentials ──────────────────────────────────────────────────────────
    'loginInput':    email,
    'login':         email,
    'usernameInput': email,
    'passwordInput': password,
    'password':      password,

    // ── Room ─────────────────────────────────────────────────────────────────
    'roomId':        roomId,
    'roomIdInput':   roomId,

    // ── Files (specific) ─────────────────────────────────────────────────────
    'fileId':        anyFile,    // generic file input — use best available
    'docxFileId':    docx,
    'xlsxFileId':    xlsx,
    'pptxFileId':    pptx,
    'pdfFileId':     pdfForm,
    'pdfFormId':     pdfForm,
    'pdfTemplateId': pdfTemplate,
    'templateFileId':pdfTemplate,

    // Folder / destination defaults to demo room root
    'folderIdInput': roomId,
    'folderId':      roomId,
    'destFolderId':  roomId,
  };

  function applyFills() {
    for (const id of Object.keys(fillMap)) {
      const value = fillMap[id];
      if (!value) continue;
      const el = document.getElementById(id);
      if (!el || el.value) continue; // skip if missing or already has a value
      el.value = value;
      // Trigger reactive listeners (e.g. enable/disable buttons)
      try { el.dispatchEvent(new Event('input',  { bubbles: true })); } catch (_) {}
      try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
    }
  }

  // This script is always injected at </body>, so DOM is already accessible.
  // Call applyFills immediately; also hook DOMContentLoaded as a safety net
  // for any edge case where readyState is still 'loading'.
  applyFills();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFills);
  }
}());
