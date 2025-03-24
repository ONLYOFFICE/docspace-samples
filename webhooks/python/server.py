import hmac
import hashlib
import os
from flask import Flask, request, abort

app = Flask(__name__)

# Load secret key from .env file
def get_secret_key():
    with open(".env", "r", encoding="utf-8") as f:
        return f.read().strip()

def get_secret_hash(secret_key, body):
    hasher = hmac.new(secret_key.encode("utf-8"), body.encode("utf-8"), hashlib.sha256)
    return "sha256=" + hasher.hexdigest().upper()

@app.route("/webhook", methods=["HEAD"])
def webhook_head():
    return "", 200

@app.route("/webhook", methods=["POST"])
def webhook_post():
    sig = request.headers.get("x-docspace-signature-256")

    if not sig:
        print("Unsigned request!")
        abort(401)

    secret_key = get_secret_key()
    body = request.get_data(as_text=True)  # Get raw body as string

    hash_value = get_secret_hash(secret_key, body)

    if sig != hash_value:
        print("Incorrect signature!")
        abort(401)
    
    print(body)
    return "", 200

if __name__ == "__main__":
    app.run(port=8080, debug=True)