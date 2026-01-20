# ONLYOFFICE DocSpace API Backend Samples (Node.js)

This directory contains **standalone Node.js examples** that demonstrate how to work with the ONLYOFFICE DocSpace Backend API.
Each file is an independent script focused on a specific API use case (users, rooms, groups, backups, security, etc.).

---

## Directory structure

```
api-backend/
└── nodejs/
    ├── samples/
    │   ├── manage-folders.js
    │   ├── manage-groups.js
    │   ├── manage-guests.js
    │   ├── manage-ip-restrictions.js
    │   ├── manage-login-settings.js
    │   ├── manage-room-links.js
    │   ├── manage-rooms.js
    │   ├── manage-trash-sections.js
    │   ├── manage-user-photo.js
    │   ├── manage-users.js
    └── README.md
```

---

## Prerequisites

- **Node.js 18+**
- Access to an **ONLYOFFICE DocSpace** portal
- A valid **API key** or authentication token

Node.js 18+ is required because the examples rely on the built-in `fetch` API.

---

## Installation

No dependencies are required.

Clone the repository and navigate to the Node.js backend samples:

```bash
git clone https://github.com/ONLYOFFICE/docspace-samples.git
cd docspace-samples/api-backend/nodejs
```

---

## Configuration

Each script contains a small configuration block at the top:

```js
const API_HOST = 'https://yourportal.onlyoffice.com';
const API_KEY = 'your_api_key';
```

Replace:

- `API_HOST` with your DocSpace portal URL
- `API_KEY` with your API key or access token

API key can be generated in:

**DocSpace → Developer Tools → API keys**

Some scripts may also require additional IDs (user ID, room ID, group ID, etc.). These are clearly marked in the code comments.

---

## Running examples

All scripts are designed to be run **individually**.

From the `nodejs` directory:

```bash
node samples/manage-users.js
```

Another example:

```bash
node samples/create-room.js
```

Each script performs a single API operation and prints the result to the console.

---

## Script philosophy

- One file = one use case
- No shared helpers or abstractions
- Minimal setup
- Easy to copy, modify, and reuse

These samples are intended as **reference implementations**, not as a production-ready SDK.

---

## Related resources

- ONLYOFFICE DocSpace Backend API documentation  
  https://api.onlyoffice.com/docspace/api-backend/get-started/basic-concepts/

- API key 
  https://api.onlyoffice.com/docspace/api-backend/get-started/authentication/api-keys/

---

## License

This project is licensed under the **Apache License 2.0**.

You may use, modify, and distribute these samples in commercial and non-commercial projects.

See the [LICENSE](../../LICENSE) file for details.