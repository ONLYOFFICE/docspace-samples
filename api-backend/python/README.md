# ONLYOFFICE DocSpace API Backend Samples · Python 🐍

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../LICENSE)

This directory contains **standalone Python examples** demonstrating how to work with the **ONLYOFFICE DocSpace Backend API**.

Each file is an independent, runnable script focused on a **single API use case**.

## 📁 Directory structure

```text
api-backend/
└── python/
    ├── samples/
    │   ├── manage_rooms.py
    │   ├── manage_files.py
    │   └── ...
    └── README.md
```

## ⚙️ Prerequisites

- **Python 3.9+**
- Access to an **ONLYOFFICE DocSpace** portal
- A valid **API key** or Personal Access Token

## 🚀 Installation

```bash
git clone https://github.com/ONLYOFFICE/docspace-samples.git
cd docspace-samples/api-backend/python
```

(Optional) Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # macOS / Linux
venv\Scripts\activate   # Windows
```

Install required dependencies:

```bash
pip install requests
```

## 🔐 Configuration

Each script contains a configuration block:

```python
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'
```

- `API_HOST` — your DocSpace portal URL  
- `API_KEY` — API key or Personal Access Token

API keys can be generated in:

**DocSpace → Developer Tools → API keys**

## ▶️ Running examples

Run any example directly:

```bash
python samples/manage_rooms.py
```

Scripts do **not depend on each other** and can be executed in any order.

## 🧠 Script philosophy

- One file = one API use case
- Minimal setup
- Easy to reuse in automation scripts

These examples are intentionally simple and focused.

## 📚 Related resources

- DocSpace Backend API documentation  
  https://api.onlyoffice.com/docspace/api-backend/get-started/basic-concepts/

- API keys  
  https://api.onlyoffice.com/docspace/api-backend/get-started/authentication/api-keys/

## 📄 License

This project is licensed under the **Apache License 2.0**.
