/*
Example: Webhook signature verification

Start a local webhook receiver and register it with DocSpace.
Each incoming request is verified using HMAC-SHA256 before the payload
is processed — rejecting any delivery that does not carry a valid signature.

Using methods:
- POST /api/2.0/settings/webhook (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-webhook/)
- DELETE /api/2.0/settings/webhook/{id} (https://api.onlyoffice.com/docspace/api-backend/usage-api/remove-webhook/)
*/

const http = require('node:http');
const crypto = require('node:crypto');

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Secret shared between DocSpace and this server.
// Set the same value in DocSpace when creating the webhook.
const WEBHOOK_SECRET = 'your-webhook-secret';

// Port for the local webhook receiver.
// Use a tunnel (e.g. ngrok) to expose this when DocSpace is cloud-hosted.
const WEBHOOK_PORT = 3000;
const WEBHOOK_PATH = '/webhooks/docspace';
const WEBHOOK_URL = `http://localhost:${WEBHOOK_PORT}${WEBHOOK_PATH}`;

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function unwrapResponse(json) {
  return json && typeof json === 'object' && 'response' in json ? json.response : json;
}

/**
 * Verify a DocSpace webhook signature.
 *
 * DocSpace signs the raw request body with HMAC-SHA256 using the webhook secret
 * and sends the result in the header: x-docspace-signature-256: sha256=<hex>
 *
 * Returns { ok, checked, reason }.
 *   ok      — whether the request should be accepted
 *   checked — false when no secret is configured (signature check skipped)
 *   reason  — "ok" | "mismatch" | "missing_header" | "bad_format" | "no_secret"
 */
function verifyDocSpaceSignature(rawBody, secret, headerValue) {
  const sec = String(secret || '').trim();
  if (!sec) return { ok: true, checked: false, reason: 'no_secret' };

  const header = String(headerValue || '').trim();
  if (!header) return { ok: false, checked: true, reason: 'missing_header' };

  const match = header.match(/^sha256=([a-fA-F0-9]{64})$/);
  if (!match) return { ok: false, checked: true, reason: 'bad_format' };

  const expected = crypto.createHmac('sha256', sec).update(rawBody).digest('hex');
  const provided = String(match[1]).toLowerCase();

  // Use timing-safe comparison to prevent timing-based side-channel attacks.
  const ok = crypto.timingSafeEqual(
    Buffer.from(expected, 'utf8'),
    Buffer.from(provided, 'utf8'),
  );
  return { ok, checked: true, reason: ok ? 'ok' : 'mismatch' };
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function createWebhook() {
  const url = `${API_HOST}/api/2.0/settings/webhook`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      name: 'Signature verification sample',
      uri: WEBHOOK_URL,
      secretKey: WEBHOOK_SECRET,
      enabled: true,
      ssl: false,
      triggers: 'FileUploaded',
    }),
  });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Webhook creation failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  return unwrapResponse(await res.json());
}

async function deleteWebhook(id) {
  const url = `${API_HOST}/api/2.0/settings/webhook/${id}`;
  const res = await fetchWithTimeout(url, { method: 'DELETE', headers: HEADERS });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Webhook deletion failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  return unwrapResponse(await res.json());
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      // DocSpace sends a HEAD request to validate the endpoint before delivering events.
      if (req.method === 'HEAD' && req.url === WEBHOOK_PATH) {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method !== 'POST' || req.url !== WEBHOOK_PATH) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }

      const rawBody = await readRawBody(req).catch(() => Buffer.alloc(0));

      // Check all header names that DocSpace may use for the signature.
      const signatureHeader =
        req.headers['x-docspace-signature-256'] ||
        req.headers['x-docspace-signature'] ||
        req.headers['x-onlyoffice-signature-256'] ||
        req.headers['x-onlyoffice-signature'] ||
        '';

      const signature = verifyDocSpaceSignature(rawBody, WEBHOOK_SECRET, signatureHeader);

      if (!signature.ok) {
        console.log(`[webhook] Rejected — reason: ${signature.reason}`);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid signature', reason: signature.reason }));
        return;
      }

      let payload;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        payload = { raw: rawBody.toString('utf8') };
      }

      console.log('[webhook] Received event:', JSON.stringify(payload, null, 2));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, signatureChecked: signature.checked }));
    });

    server.listen(WEBHOOK_PORT, () => {
      console.log(`Webhook receiver listening on http://localhost:${WEBHOOK_PORT}`);
      resolve(server);
    });
  });
}

(async () => {
  const server = await startServer();

  const webhook = await createWebhook();
  const webhookId = webhook?.id ?? null;
  console.log('Registered webhook:', webhook);

  console.log('\nWaiting for webhook events... Press Ctrl+C to stop.\n');

  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    if (webhookId) {
      const deleted = await deleteWebhook(webhookId);
      console.log('Deleted webhook:', deleted);
    }
    server.close(() => process.exit(0));
  });
})();
