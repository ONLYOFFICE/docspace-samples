/*
Example: Manage webhooks and retry failed delivery

This example demonstrates how to create, list, update, retry, and delete tenant webhooks in ONLYOFFICE DocSpace.
If there is no failed delivery log for the created webhook, the retry step is skipped.

Using methods:
- POST /api/2.0/settings/webhook (https://api.onlyoffice.com/docspace/api-backend/usage-api/create-webhook/)
- GET /api/2.0/settings/webhook (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-tenant-webhooks/)
- PUT /api/2.0/settings/webhook (https://api.onlyoffice.com/docspace/api-backend/usage-api/update-webhook/)
- GET /api/2.0/settings/webhooks/log (https://api.onlyoffice.com/docspace/api-backend/usage-api/get-webhooks-logs/)
- PUT /api/2.0/settings/webhook/{id}/retry (https://api.onlyoffice.com/docspace/api-backend/usage-api/retry-webhook/)
- DELETE /api/2.0/settings/webhook/{id} (https://api.onlyoffice.com/docspace/api-backend/usage-api/remove-webhook/)
*/

// Set API base URL
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';

// Headers with API key for authentication
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

function unwrapResponse(json) {
  return json && typeof json === 'object' && 'response' in json ? json.response : json;
}

async function createWebhook(name, uri) {
  const url = `${API_HOST}/api/2.0/settings/webhook`;
  const body = {
    name,
    uri,
    secretKey: 'webhook-secret-demo',
    enabled: true,
    ssl: true,
    triggers: 'FileUploaded',
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Webhook creation failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  return unwrapResponse(await res.json());
}

async function listWebhooks() {
  const url = `${API_HOST}/api/2.0/settings/webhook`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Webhook list request failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  return unwrapResponse(await res.json());
}

async function updateWebhook(id, name, uri) {
  const url = `${API_HOST}/api/2.0/settings/webhook`;
  const body = {
    id,
    name,
    uri,
    secretKey: 'webhook-secret-demo-updated',
    enabled: true,
    ssl: true,
    triggers: 'RoomCreated',
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Webhook update failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  return unwrapResponse(await res.json());
}

async function getWebhookLogs(configId) {
  const params = new URLSearchParams({
    configId: String(configId),
    count: '10',
    startIndex: '0',
  });
  const url = `${API_HOST}/api/2.0/settings/webhooks/log?${params}`;
  const res = await fetch(url, { method: 'GET', headers: HEADERS });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Webhook logs request failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  return unwrapResponse(await res.json());
}

function pickFailedLog(logs) {
  if (!Array.isArray(logs)) return null;
  return logs.find((item) => typeof item?.status === 'number' && item.status >= 400) || null;
}

async function retryWebhook(logId) {
  const url = `${API_HOST}/api/2.0/settings/webhook/${logId}/retry`;
  const res = await fetch(url, { method: 'PUT', headers: HEADERS });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Webhook retry failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  return unwrapResponse(await res.json());
}

async function deleteWebhook(id) {
  const url = `${API_HOST}/api/2.0/settings/webhook/${id}`;
  const res = await fetch(url, { method: 'DELETE', headers: HEADERS });

  if (res.status !== 200) {
    const text = await res.text();
    console.error(`Webhook deletion failed. Status code: ${res.status}, Message: ${text}`);
    return null;
  }

  return unwrapResponse(await res.json());
}

(async () => {
  let webhookId = null;

  try {
    const created = await createWebhook('Docs API sample webhook', 'https://example.com/webhooks/docspace');
    webhookId = created?.id ?? null;
    console.log('Created webhook:', created);

    const list = await listWebhooks();
    console.log('Webhook list:', list);

    if (!webhookId) {
      console.log('Webhook ID was not returned. Stopping the sample.');
      return;
    }

    const updated = await updateWebhook(
      webhookId,
      'Docs API sample webhook updated',
      'https://example.com/webhooks/docspace-updated',
    );
    console.log('Updated webhook:', updated);

    const logs = await getWebhookLogs(webhookId);
    console.log('Webhook logs:', logs);

    const failedLog = pickFailedLog(logs);
    if (failedLog) {
      const retried = await retryWebhook(failedLog.id);
      console.log('Retried failed webhook delivery:', retried);
    } else {
      console.log('No failed webhook delivery log found for retry.');
    }
  } catch (err) {
    console.error(err?.message || err);
  } finally {
    if (webhookId) {
      const deleted = await deleteWebhook(webhookId);
      console.log('Deleted webhook:', deleted);
    }
  }
})();
