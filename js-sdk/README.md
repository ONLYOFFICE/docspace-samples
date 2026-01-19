# ONLYOFFICE DocSpace JavaScript SDK Examples

This repository contains a set of ready-to-use examples demonstrating how to integrate **ONLYOFFICE DocSpace** into web applications using the **JavaScript SDK**.

The examples are designed to be simple, visual, and practical. They show how to embed DocSpace UI components, interact with rooms, folders, and files, and build real integration scenarios without calling the REST API directly.

---

## Overview

This project demonstrates how to:

- Initialize DocSpace SDK components (Manager, Editor, Viewer, Selectors)
- Work with rooms, folders, and files using SDK methods
- Create files and folders in the current navigation context
- Manage tags and room settings
- Retrieve contextual information (selection, folder info, config)
- Build advanced workflows on top of embedded DocSpace UI

All interactions are performed via the **DocSpace JavaScript SDK**.  
No direct API requests are used, which helps avoid CORS issues and keeps examples focused on SDK usage.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm (installed with Node.js)
- An active ONLYOFFICE DocSpace portal

---

## Repository Structure

Examples are grouped into two categories:

### Basic samples

Basic samples demonstrate individual SDK capabilities in isolation:

- SDK initialization
- Creating files, folders, rooms, and tags
- Getting folder, selection, and configuration information
- Authorization helpers and hash generation
- Frame lifecycle management

These examples are intended to help you understand specific SDK methods and events.

### Advanced samples

Advanced samples demonstrate complete integration scenarios:

- Creating files in the currently opened folder
- Task-related file creation flows
- Project and room setup with predefined structure
- File attachment flows
- Two-factor authentication scenarios
- Embedding DocSpace as part of business applications

Each example is implemented as a standalone HTML file and can be opened independently.

---

## Getting Started

### 1. Install dependencies

From the root directory of the project, install the required dependencies:

```
npm install
```

---

### 2. Environment configuration

This repository already contains an `.env` file used by the local server.

Update the existing `.env` file and specify your DocSpace portal address:

```
PORTAL_SRC=https://your-docspace-portal.com
```

The `PORTAL_SRC` value is used to dynamically load the DocSpace JavaScript SDK and initialize all embedded examples.

---

### 3. Start the local server

Run the local development server:

```
npm run dev
```

or

```
npm start
```

By default, the server will be available at:

```
http://localhost:3030
```

---

### 4. Open the Examples Hub

Open the following URL in your browser:

```
http://localhost:3030
```

The Examples Hub provides:

- A configuration panel for portal URL and credentials
- A visual list of Basic and Advanced samples
- Search and filtering
- One-click opening of each example in a new tab

---

## How the Examples Work

### SDK loading

All examples load the DocSpace SDK directly from your portal:

```html
<script src="{PORTAL_SRC}/static/scripts/sdk/2.0.0/api.js"></script>
```

No additional client-side SDK installation is required.

---

### Navigation context

For examples that create files or folders, the SDK uses the **current folder context** inside the embedded Manager:

```js
docSpace.getFolderInfo()
```

This means users navigate folders directly within the DocSpace UI, and all actions are applied to the currently opened location.  
No additional folder selectors are required for these scenarios.

---

### Authentication

Some examples require authentication. This can be done by:

- Logging in through the embedded DocSpace UI
- Providing credentials via the Examples Hub (development only)

Credentials are stored locally in the browser for convenience.  
This approach is intended for demo purposes only and should not be used in production environments.

---

## Documentation

Useful references:

- DocSpace JavaScript SDK overview  
  https://api.onlyoffice.com/docspace/javascript-sdk/

---

## Notes

- These examples are provided for demonstration and integration guidance
- Review and adapt the code before using it in production
- Follow standard security practices when handling authentication data

---

## License

This project is distributed under the Apache-2.0 license found in the [LICENSE](../LICENSE) file.
