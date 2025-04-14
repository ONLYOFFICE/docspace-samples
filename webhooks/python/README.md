# Webhooks Example (Flask - Python)

This example server demonstrates how to set up and receive events with [ONLYOFFICE DocSpace Webhooks](https://helpcenter.onlyoffice.com/docspace/configuration/docspace-webhooks.aspx).

In particular, this project demonstrates:

1. Receiving notifications about changes in DocSpace
2. Verifying the integrity of notifications with HMAC signatures


## System Requirements

- [Python](https://www.python.org/downloads/)
- [Flask](https://flask.palletsprojects.com/en/stable/)


## Usage

1. Navigate to the root directory of this project and install dependencies:

```
pip install -r requirements.txt
```

2. Download, set up, and run ngrok on your local machine via the official instructions:

```
https://ngrok.com/docs/getting-started/
```

Ngrok is used to create a publicly accessible "tunnel" (i.e., URL) to a port on your local machine. By default, the Express server in this demo runs on port `8080`, so ensure that ngrok is set up to tunnel to the correct port where your server is running.

For example: Using the default settings, you can run ngrok on your local machine with the following command:

```
ngrok http 8080
```

3. Create the **.env** file in the root directory of this app. In the file, include the following lines:

```
PORTAL_URL=
API_KEY=
WEBHOOK_SECRET_KEY=
```

> **Note:** In a production environment, this value should be securely stored. For security reasons, ensure that you never commit or expose this value in a public repository.

Enter your portal address, [API key](https://api.onlyoffice.com/docspace/api-backend/get-started/basic-concepts/) for authorization and secret key for webhook.

For your convenience, a sample **.env.template** file is included in the root directory of this application.

4. After ngrok is successfully running, the next steps are to run the server:

```
python server.py
```

5. Edit the **create_webhook.py** setup script to to include the information to [create](https://api.onlyoffice.com/docspace/api-backend/usage-api/create-webhook/) the webhook:

```python
# TODO: Replace these values ​​with your own.
name = "My Webhook" # Webhook name
uri = "http://localhost:8080/webhook" # Webhook payload url
ssl = True # SSL verification
triggers = 0 # All triggers are selected by default
target_id= "" # Target ID
```

> **Note:** Make sure to set the payload url parameter to your public ngrok domain instead of a `localhost` domain. This means you must replace `localhost:8000` with your unique ngrok domain. The target URI should be your ngrok server's "Forwarding" domain followed by `/webhook`. 
> 
> The final value for your target URI will look something like this: `https://a1c8-3-125-222-163.ngrok-free.app/webhook`. 

6. Run the setup script to create new webhook:

```
python create_webhook.py
```

7. In the DocSpace UI (or via the API), perform some actions corresponding with chosen triggers (e.g., create folder).

8. The Express server will output webhook event notifications in the console about your changes in DocSpace!