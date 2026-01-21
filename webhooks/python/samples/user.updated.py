# Admin and user notification about account status

from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import JSONResponse
import hashlib
import hmac
import os
import aiohttp
import asyncio
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

PORTAL_URL = os.getenv("PORTAL_URL")
API_KEY = os.getenv("API_KEY")
WEBHOOK_SECRET_KEY = os.getenv("WEBHOOK_SECRET_KEY")
NOTIFY_WEBHOOK_URL = os.getenv("NOTIFY_WEBHOOK_URL")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")


def verify_signature(secret_key: str, payload: bytes, signature: str) -> bool:
    computed_hash = hmac.new(secret_key.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={computed_hash}", signature)


async def notify_admin(session: aiohttp.ClientSession, subject: str, message: str):
    payload = {
        "to": ADMIN_EMAIL,
        "subject": subject,
        "message": message
    }
    await session.post(NOTIFY_WEBHOOK_URL, json=payload, headers={"Content-Type": "application/json"})


async def notify_user(session: aiohttp.ClientSession, email: str, subject: str, message: str):
    payload = {
        "to": email,
        "subject": subject,
        "message": message
    }
    await session.post(NOTIFY_WEBHOOK_URL, json=payload, headers={"Content-Type": "application/json"})


@app.post("/webhook")
async def webhook(
    request: Request,
    x_docspace_signature_256: str = Header(None)
):
    body = await request.body()

    if not x_docspace_signature_256 or not verify_signature(WEBHOOK_SECRET_KEY, body, x_docspace_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    event = payload.get("event", {}).get("trigger")
    user = payload.get("payload", {})

    if event != "user.updated":
        return JSONResponse(content={"message": "Event ignored"}, status_code=200)

    user_name = user.get("userName", "[no username]")
    email = user.get("email", "[no email]")
    status = "inactive" if user.get("status") == 2 else "active"
    timestamp = datetime.utcnow().isoformat()

    print(f"User updated: {user_name} ({email}) - {status}")

    try:
        async with aiohttp.ClientSession() as session:
            # Step 1: Notify admin
            await notify_admin(
                session,
                subject="👤 User Updated",
                message=f'The user "{user_name}" (Email: {email}) has been updated.\nStatus: {status}\nTime: {timestamp}'
            )

            # Step 2: Notify user
            await notify_user(
                session,
                email=email,
                subject="Your account status has been updated",
                message=(
                    f"Dear {user_name},\n\n"
                    f"Your account status has been updated to: {status}.\n\n"
                    f"If you have any questions, please contact support.\n\nThank you!"
                )
            )

        return JSONResponse(content={"message": "Success"}, status_code=200)

    except Exception as e:
        print(f"Error notifying about user update: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
