# ONLYOFFICE DocSpace API Backend Samples · Node.js 🟢

![Node.js](https://img.shields.io/badge/Node.js-18%2B-3c873a?logo=node.js&logoColor=white)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../LICENSE)

This directory contains **standalone Node.js examples** demonstrating how to work with the **ONLYOFFICE DocSpace Backend API**.

Each file represents a **single API use case** (users, rooms, groups, backups, security, etc.) and can be executed independently.

## 📁 Directory structure

```text
api-backend/
└── nodejs/
    ├── samples/
    │   ├── manage-users.js
    │   ├── manage-rooms.js
    │   ├── manage-groups.js
    │   └── ...
    └── README.md
```

## ⚙️ Prerequisites

- **Node.js 18+** (required for built-in `fetch`)
- Access to an **ONLYOFFICE DocSpace** portal
- A valid **API key** or authentication token

## 🚀 Installation

No dependencies are required.

```bash
git clone https://github.com/ONLYOFFICE/docspace-samples.git
cd docspace-samples/api-backend/nodejs
```

## 🔐 Configuration

Each script contains a small configuration block at the top:

```js
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';
```

- `API_HOST` — your DocSpace portal URL  
- `API_KEY` — API key or access token

API keys can be generated in:

**DocSpace → Developer Tools → API keys**

Some examples may require additional IDs (user ID, room ID, group ID).  
These are clearly marked in the code comments.

## ▶️ Running examples

All scripts are executed **individually**:

```bash
node samples/manage-users.js
```

Each script performs one API operation and prints the result to the console.

## 🧠 Script philosophy

- One file = one use case
- No shared helpers or abstractions
- Minimal setup
- Easy to copy, modify, and reuse

These samples are **reference implementations**, not a production SDK.

## 📚 Related resources

- DocSpace Backend API documentation  
  https://api.onlyoffice.com/docspace/api-backend/get-started/basic-concepts/

- API keys  
  https://api.onlyoffice.com/docspace/api-backend/get-started/authentication/api-keys/

## 📄 License

This project is licensed under the **Apache License 2.0**.
