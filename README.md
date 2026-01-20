# ONLYOFFICE DocSpace Samples

This repository contains **official ONLYOFFICE DocSpace integration samples**.
It demonstrates different ways to interact with DocSpace — via REST API, webhooks, OAuth, and the JavaScript SDK.

The repository is intended for developers who want to:
- automate DocSpace administration and content management,
- integrate DocSpace with third‑party systems,
- embed DocSpace UI into their applications,
- build event‑driven workflows using webhooks.

All samples are **self‑contained**, **runnable**, and focused on a specific integration scenario.

---

## Repository structure

The samples are grouped by integration type and technology.

```
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

## API backend samples

Backend samples demonstrate how to work with the **DocSpace REST API** (`/api/2.0/...`).  
They are designed as **standalone scripts**, where each file represents a single API use case.

Supported languages:
- **Node.js**
- **Python**

Typical use cases:
- user and group management,
- room and file operations,
- access control and security settings,
- backups and portal maintenance,
- administrative automation.

Each language folder contains its own README with detailed instructions:

- [Node.js backend samples](api-backend/nodejs/README.md)
- [Python backend samples](api-backend/python/README.md)

---

## Webhooks

Webhook samples show how to receive and process **DocSpace events** in real time.

They demonstrate:
- how to expose webhook endpoints,
- how to validate incoming requests,
- how to react to DocSpace events using the REST API.

Supported languages:
- **Node.js**
- **Python**

See:
- [Node.js webhook samples](webhooks/nodejs/README.md)
- [Python webhook samples](webhooks/python/README.md)

---

## JavaScript SDK examples

JavaScript SDK samples demonstrate **frontend integration** with DocSpace.

They include examples of:
- embedding DocSpace Manager UI,
- using room and file selectors,
- building custom user flows around the SDK.

These samples are intended for:
- SaaS integrations,
- custom portals,
- UI prototyping and demos.

See:
- [JavaScript SDK samples](js-sdk/README.md)

---

## OAuth 2.0 examples

OAuth samples demonstrate how to authenticate users using **OAuth 2.0** instead of API key.

They are recommended for:
- multi‑user integrations,
- public applications,
- long‑running services.

See:
- [OAuth 2.0 samples](oauth2/README.md)

---

## Authentication methods

Depending on the sample type, the following authentication methods are used:

- **API key** — simple authentication for scripts and demos
- **OAuth 2.0** — user‑based authentication for applications
- **Webhook secrets** — request verification for webhook receivers

Authentication requirements are documented in each section README.

---

## Documentation

- DocSpace API overview:  
  https://api.onlyoffice.com/docspace/

- DocSpace Backend API reference:  
  https://api.onlyoffice.com/docspace/api-backend/get-started/basic-concepts/

- JavaScript SDK documentation:  
  https://api.onlyoffice.com/docspace/javascript-sdk/get-started/

- OAuth 2.0 documentation:  
  https://api.onlyoffice.com/docspace/api-backend/get-started/authentication/oauth2/

- Webhooks documentation:  
  https://api.onlyoffice.com/docspace/api-backend/get-started/how-it-works/webhooks/

---

## License

This project is licensed under the **Apache License 2.0**.

See the [LICENSE](LICENSE) file for details.
