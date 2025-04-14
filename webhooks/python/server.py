import os
import hmac
import hashlib
from dotenv import load_dotenv
from flask import Flask, request, abort

# Load environment variables
load_dotenv()

app = Flask(__name__)

def get_secret_hash(secret_key, body):
    hasher = hmac.new(secret_key.encode("utf-8"), body.encode("utf-8"), hashlib.sha256)
    return "sha256=" + hasher.hexdigest().upper()

# listening head request for verification of the webhook URL
@app.route("/webhook", methods=["HEAD"])
def webhook_head():
    return "", 200

# listening post request for the webhook
@app.route("/webhook", methods=["POST"])
def webhook_post():
    sig = request.headers.get("x-docspace-signature-256")

    if not sig:
        print("Unsigned request!")
        abort(401)

    secret_key = os.getenv('WEBHOOK_SECRET_KEY')
    body = request.get_data(as_text=True)  # Get raw body as string

    hash_value = get_secret_hash(secret_key, body)

    if sig != hash_value:
        print("Incorrect signature!")
        abort(401)
    
    print(body)
    return "", 200

if __name__ == "__main__":
    app.run(port=8080, debug=True)