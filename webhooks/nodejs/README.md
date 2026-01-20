# ONLYOFFICE DocSpace Webhook Samples (Node.js)

This directory contains **Node.js examples** demonstrating how to receive and process
**webhook events** from **ONLYOFFICE DocSpace**.

Webhooks allow your application to react to DocSpace events
in real time without polling the API.

---

## What these samples demonstrate

The Node.js webhook examples show:

- how to expose an HTTP endpoint for webhook events,
- how to validate incoming webhook requests,
- how to parse event payloads sent by DocSpace,
- how to trigger backend logic in response to events.

The samples focus on **event handling mechanics**
rather than complete business workflows.

---

## Prerequisites

- **Node.js 18+**
- An accessible public URL (required for webhook delivery)
- An active ONLYOFFICE DocSpace portal

---

## Installation

Install dependencies:

```bash
npm install
```

---

## Configuration

Each example contains a small configuration block or uses environment variables
to define:

- webhook secret (if request validation is enabled),
- server port.

Make sure the webhook endpoint URL is reachable by DocSpace.

---

## Running the webhook receiver

Start the server:

```bash
node index.js
```

or, if specified in the example:

```bash
npm start
```

Once running, configure the webhook URL in DocSpace
and point it to the exposed endpoint.

---

## Typical use cases

Webhook integrations are commonly used to:

- synchronize data with external systems,
- react to file or room changes,
- trigger automation workflows,
- monitor DocSpace activity.

---

## Related resources

- Webhooks in DocSpace  
  https://api.onlyoffice.com/docspace/api-backend/get-started/how-it-works/webhooks/

- DocSpace Backend API documentation  
  https://api.onlyoffice.com/docspace/api-backend/get-started/basic-concepts/

---

## License

This project is licensed under the **Apache License 2.0**.

See the [LICENSE](../../LICENSE) file for details.
