# ONLYOFFICE DocSpace JavaScript SDK Examples 🧩

![JavaScript](https://img.shields.io/badge/JavaScript-SDK-yellow?logo=javascript&logoColor=black)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../LICENSE)

This directory contains **ready-to-use frontend examples** demonstrating how to integrate
**ONLYOFFICE DocSpace** into web applications using the **JavaScript SDK**.

The examples focus on **UI embedding and interaction** and do not require direct REST API calls.

## ✨ What these samples demonstrate

- Initializing DocSpace SDK components (Manager, Editor, Viewer, Selectors)
- Working with rooms, folders, and files via SDK methods
- Creating files and folders in the current navigation context
- Managing tags and room settings
- Building complete UI-driven integration scenarios

All interactions are performed via the **DocSpace JavaScript SDK**,
which helps avoid CORS issues and keeps examples focused on frontend logic.

## ⚙️ Prerequisites

- **Node.js 18+**
- npm (included with Node.js)
- An active **ONLYOFFICE DocSpace** portal

## 📁 Repository structure

Examples are grouped into two categories:

### Basic samples
Basic samples demonstrate individual SDK capabilities in isolation:
- SDK initialization
- Creating rooms, folders, and files
- Retrieving folder, selection, and configuration information
- Frame lifecycle management

### Advanced samples
Advanced samples demonstrate complete integration scenarios:
- Creating files in the currently opened folder
- Project and task-related workflows
- File attachment flows
- Two-factor authentication scenarios
- Embedding DocSpace into business applications

Each example is implemented as a standalone HTML file.

## 🚀 Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment configuration

Update the existing `.env` file and specify your DocSpace portal address:

```env
PORTAL_SRC=https://your-docspace-portal.com
```

### 3. Start the local server

```bash
npm start
```

The server will be available at:

```
http://localhost:3030
```

## 🧠 How the examples work

All examples load the DocSpace SDK directly from your portal:

```html
<script src="{PORTAL_SRC}/static/scripts/sdk/2.0.0/api.js"></script>
```

The SDK automatically uses the current navigation context
inside the embedded DocSpace Manager.

## 📚 Documentation

- DocSpace JavaScript SDK overview  
  https://api.onlyoffice.com/docspace/javascript-sdk/get-started/

## 📄 License

This project is licensed under the **Apache License 2.0**.
