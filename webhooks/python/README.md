# ONLYOFFICE DocSpace Webhook Samples · Python 🐍

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../LICENSE)

This directory contains **Python examples** demonstrating how to receive and process
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

- **Python 3.9+**
- An accessible public URL (required for webhook delivery)
- An active **ONLYOFFICE DocSpace** portal

## 🚀 Installation

(Optional) Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # macOS / Linux
venv\Scripts\activate   # Windows
```

Install required dependencies:

```bash
pip install flask
```

## 🔐 Configuration

Each example contains a small configuration block defining:

- webhook secret (if request validation is enabled),
- server host and port.

Make sure the webhook endpoint URL is reachable by DocSpace.

## ▶️ Running the webhook receiver

```bash
python app.py
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
