# ONLYOFFICE DocSpace Samples 📦

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-supported-3c873a?logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-supported-3776AB?logo=python&logoColor=white)
![Type](https://img.shields.io/badge/type-integration%20samples-lightgrey)

This repository contains **official ONLYOFFICE DocSpace integration samples**.

It provides **practical, ready-to-use examples** that demonstrate different ways to interact with DocSpace:
REST API, webhooks, OAuth 2.0, and the JavaScript SDK.

These samples are intended for developers and integrators who want to:
- ⚙️ automate DocSpace administration and content management,
- 🔗 integrate DocSpace with third-party systems,
- 🧩 embed DocSpace UI into their applications,
- 🔔 build event-driven workflows using webhooks.

All examples are **self-contained**, **runnable**, and focused on a specific integration scenario.

---

## 📁 Repository structure

The samples are grouped by integration type and technology:

```text
docspace-samples/
├── api-backend/
│   ├── nodejs/
│   └── python/
├── webhooks/
│   ├── nodejs/
│   └── python/
├── js-sdk/
├── oauth2/
└── LICENSE
```

---

## 🔧 API backend samples

Backend samples demonstrate how to work with the **DocSpace REST API** (`/api/2.0/...`).

They are implemented as **standalone scripts**, where each file represents a single API use case.

**Supported languages:**
- 🟢 Node.js
- 🐍 Python

**Typical scenarios include:**
- user and group management,
- room and file operations,
- access control and security settings,
- backups and portal maintenance,
- administrative automation.

Each language directory contains its own README with detailed instructions:

- [Node.js backend samples](api-backend/nodejs/README.md)
- [Python backend samples](api-backend/python/README.md)

---

## 🔔 Webhooks

Webhook samples demonstrate how to receive and process **DocSpace events** in real time.

They show how to:
- expose webhook endpoints,
- validate incoming requests,
- react to DocSpace events using backend logic or API calls.

**Supported languages:**
- 🟢 Node.js
- 🐍 Python

See:
- [Node.js webhook samples](webhooks/nodejs/README.md)
- [Python webhook samples](webhooks/python/README.md)

---

## 🧩 JavaScript SDK examples

JavaScript SDK samples demonstrate **frontend integration** with DocSpace.

They include examples of:
- embedding DocSpace Manager UI,
- using room and file selectors,
- building custom user flows around the SDK.

These samples are suitable for:
- SaaS integrations,
- custom portals,
- UI prototyping and demos.

👉 See: [JavaScript SDK samples](js-sdk/README.md)

---

## 🔐 OAuth 2.0 examples

OAuth samples demonstrate how to authenticate users using **OAuth 2.0**
instead of API keys or personal access tokens.

They are recommended for:
- multi-user integrations,
- public or third-party applications,
- long-running services acting on behalf of users.

👉 See: [OAuth 2.0 samples](oauth2/README.md)

---

## 🔑 Authentication methods

Depending on the integration type, the following authentication methods are used:

- **API key / Personal Access Token** — simple authentication for scripts and demos
- **OAuth 2.0** — user-based authentication for applications
- **Webhook secrets** — request verification for webhook receivers

Authentication details are documented in each section README.

---

## 📚 Documentation

- DocSpace API overview  
  https://api.onlyoffice.com/docspace/

- DocSpace Backend API reference  
  https://api.onlyoffice.com/docspace/api-backend/get-started/basic-concepts/

- JavaScript SDK documentation  
  https://api.onlyoffice.com/docspace/javascript-sdk/get-started/

- OAuth 2.0 documentation  
  https://api.onlyoffice.com/docspace/api-backend/get-started/authentication/oauth2/

- Webhooks documentation  
  https://api.onlyoffice.com/docspace/api-backend/get-started/how-it-works/webhooks/

---

## 📄 License

This project is licensed under the **Apache License 2.0**.

See the [LICENSE](LICENSE) file for details.
