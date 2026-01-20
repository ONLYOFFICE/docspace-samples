# ONLYOFFICE DocSpace API Backend Samples (Python)

This directory contains **standalone Python examples** demonstrating how to work with the ONLYOFFICE DocSpace Backend API.

Each file is an independent, runnable script focused on a **single API use case**
(users, rooms, groups, backups, security, etc.).

The samples are intended as **reference implementations** for automation,
administrative scripts, and backend integrations.

---

## Directory structure

```
api-backend/
└── python/
    ├── samples/
    │   ├── add_members_to_group.py
    │   ├── authenticate_user.py
    │   ├── manage_files.py
    │   ├── manage_rooms.py
    │   ├── delete_backup.py
    │   └── get_backup_history.py
    └── README.md
```

Each file name reflects the API action it demonstrates.

---

## Prerequisites

- **Python 3.9+**
- Access to an **ONLYOFFICE DocSpace** portal
- A valid **API key**

---

## Installation

Clone the repository and navigate to the Python backend samples:

```bash
git clone https://github.com/ONLYOFFICE/docspace-samples.git
cd docspace-samples/api-backend/python
```

(Optional) Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # macOS / Linux
venv\Scripts\activate    # Windows
```

Install required dependencies:

```bash
pip install requests
```

No additional libraries are required.

---

## Configuration

Each script contains a small configuration block at the top:

```python
API_HOST = 'https://yourportal.onlyoffice.com'
API_KEY = 'your_api_key'
```

Replace:

- `API_HOST` — your DocSpace portal URL
- `API_KEY` — your API key

API key can be generated in:

**DocSpace → Developer Tools → API keys**

Some scripts may require additional identifiers
(user ID, room ID, group ID, etc.).
These values are clearly marked in the code comments.

---

## Running examples

All scripts are designed to be run **individually**.

From the `python` directory:

```bash
python samples/manage_rooms.py
```

Another example:

```bash
python samples/add_members_to_group.py
```

Each script performs a single API operation and prints the result to the console.

Examples do **not depend on each other** and can be executed in any order.

---

## Script philosophy

- One file = one API use case
- No shared helpers or abstractions
- Minimal setup
- Easy to copy, modify, and reuse

These samples are intentionally simple and focused.
They are **not a framework or SDK**, but practical starting points
for building your own automation and integrations.

---

## Common issues

### 401 / 403 errors

Possible reasons:

- Invalid or expired API key
- Insufficient permissions for the token
- Incorrect DocSpace portal URL

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