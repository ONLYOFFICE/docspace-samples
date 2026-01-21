# ONLYOFFICE DocSpace OAuth 2.0 Samples 🔐

![OAuth2](https://img.shields.io/badge/auth-OAuth%202.0-orange)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../LICENSE)

This directory contains examples demonstrating how to authenticate users
in **ONLYOFFICE DocSpace** using **OAuth 2.0**.

OAuth 2.0 authentication is recommended for applications that work
on behalf of users, such as public web services, SaaS platforms,
and multi-user integrations.

The examples are provided for **Node.js** and **Python**
and demonstrate the same OAuth 2.0 flow using different stacks.

## ✨ What these samples demonstrate

- Initiating the OAuth authorization flow
- Handling the authorization callback
- Obtaining an access token for a user
- Using the token to call the DocSpace Backend API

The samples focus on **authentication mechanics**
and are intended to be combined with backend API samples.

## 📁 Directory structure

```text
oauth2/
├── nodejs/
├── python/
└── README.md
```

## ⚙️ Prerequisites

- An active **ONLYOFFICE DocSpace** portal
- OAuth 2.0 credentials registered in DocSpace

Additional requirements depend on the implementation:
- **Node.js** — Node.js 18+
- **Python** — Python 3.9+

## ▶️ Running the examples

### Node.js

```bash
cd nodejs
npm install
npm start
```

### Python

```bash
cd python
pip install flask requests
python app.py
```

Open the application URL in your browser
to initiate the OAuth authorization flow.

## 📚 Documentation

- OAuth 2.0 authentication in DocSpace  
  https://api.onlyoffice.com/docspace/api-backend/get-started/authentication/oauth2/

- DocSpace Backend API documentation  
  https://api.onlyoffice.com/docspace/api-backend/

## 📄 License

This project is licensed under the **Apache License 2.0**.
