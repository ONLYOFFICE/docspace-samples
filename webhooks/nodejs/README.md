# ONLYOFFICE DocSpace Webhook Samples · Node.js 🔔

![Node.js](https://img.shields.io/badge/Node.js-18%2B-3c873a?logo=node.js&logoColor=white)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../LICENSE)

This directory contains **Node.js examples** demonstrating how to receive and process
**webhook events** from **ONLYOFFICE DocSpace**.

Webhooks allow your application to react to DocSpace events
in real time without polling the API.

## ✨ What these samples demonstrate

- Exposing an HTTP endpoint for webhook events
- Validating incoming webhook requests
- Parsing event payloads sent by DocSpace
- Triggering backend logic in response to events

The samples focus on **event handling mechanics**
rather than complete business workflows.

## ⚙️ Prerequisites

- **Node.js 18+**
- An accessible public URL (required for webhook delivery)
- An active **ONLYOFFICE DocSpace** portal

## 🚀 Installation

```bash
npm install
```

## 🔐 Configuration

Each example contains a small configuration block or uses environment variables
to define:

- webhook secret (if request validation is enabled),
- server port.

Make sure the webhook endpoint URL is reachable by DocSpace.

## ▶️ Running the webhook receiver

```bash
node index.js
```

or, if specified:

```bash
npm start
```

Once running, configure the webhook URL in DocSpace
and point it to the exposed endpoint.

## 📚 Related resources

- Webhooks in DocSpace  
  https://api.onlyoffice.com/docspace/api-backend/get-started/how-it-works/webhooks/

- DocSpace Backend API documentation  
  https://api.onlyoffice.com/docspace/api-backend/get-started/basic-concepts/

## 📄 License

This project is licensed under the **Apache License 2.0**.
