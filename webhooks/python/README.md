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

3. Create the **.env** file in the root directory of this app and store your secret key in it as a string.

4. After ngrok is successfully running, the next steps are to run the server:

```
python server.py
```

5. Create Webhook in DocSpace UI

 - Insert Webhook name
 - The Payload URL should be your ngrok server's "Forwarding" domain followed by /webhook.
 - Insert secret key from step 3.
 - Choose triggers if needed (e.g., "Folder created").
 
The final value for your Payload URI will look something like this: `https://a1c8-3-125-222-163.ngrok-free.app/webhook`. 

6. In the DocSpace UI (or via the API), perform some actions corresponding with chosen triggers (e.g., create folder).

7. The Express server will output webhook event notifications in the console about your changes in DocSpace!