# ONLYOFFICE DocSpace OAuth 2.0 Samples

This directory contains examples demonstrating how to authenticate users
in **ONLYOFFICE DocSpace** using **OAuth 2.0**.

OAuth 2.0 authentication is recommended for applications that work
on behalf of users, such as public web services, SaaS platforms,
and multi-user integrations.

The examples are provided for **Node.js** and **Python** and demonstrate
the same OAuth 2.0 flows using different technology stacks.

---

## What these samples demonstrate

The OAuth 2.0 examples show:

- how to initiate the OAuth authorization flow,
- how to handle the authorization callback,
- how to obtain an access token for a user,
- how to use the token to call the DocSpace Backend API.

The samples focus on the **authentication flow** and are intended
to be combined with backend API samples for real-world integrations.

---

## Directory structure

```
oauth2/
├── nodejs/
│   └── ...
├── python/
│   └── ...
└── README.md
```

Each language directory contains a runnable OAuth 2.0 example
implemented using the corresponding stack.

---

## Prerequisites

- An active **ONLYOFFICE DocSpace** portal
- OAuth 2.0 credentials registered in DocSpace

Additional requirements depend on the selected implementation:

- **Node.js** examples require Node.js 18+
- **Python** examples require Python 3.9+

---

## Configuration

Each example contains configuration variables or uses environment variables
to define:

- client ID,
- client secret,
- redirect URI,
- server host and port.

Make sure the redirect URI exactly matches the one configured
for your OAuth application in DocSpace.

---

## Running the examples

### Node.js

Navigate to the Node.js OAuth example directory and install dependencies:

```bash
cd nodejs
npm install
```

Start the OAuth example server:

```bash
node index.js
```

or, if specified in the project:

```bash
npm start
```

Open the application URL in your browser
to initiate the OAuth authorization flow.

---

### Python

Navigate to the Python OAuth example directory.

(Optional) Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # macOS / Linux
venv\Scripts\activate   # Windows
```

Install required dependencies:

```bash
pip install flask requests
```

Start the OAuth example application:

```bash
python app.py
```

Open the application URL in your browser
to initiate the OAuth authorization flow.

---

## Typical use cases

OAuth 2.0 authentication is recommended when:

- your application serves multiple users,
- users must explicitly grant access to their DocSpace account,
- you are building a public or third-party integration,
- you need secure access without storing user passwords.

---

## Related resources

- OAuth 2.0 authentication in DocSpace  
  https://api.onlyoffice.com/docspace/api-backend/get-started/authentication/oauth2/

- DocSpace Backend API documentation  
  https://api.onlyoffice.com/docspace/api-backend/get-started/basic-concepts/

---

## License

This project is licensed under the **Apache License 2.0**.

See the [LICENSE](../LICENSE) file for details.
