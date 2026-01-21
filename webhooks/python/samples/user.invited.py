# Welcome Room Access and HR Folder Creation on User Invite

from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import JSONResponse
import hashlib
import hmac
import os
import aiohttp
import asyncio
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

PORTAL_URL = os.getenv("PORTAL_URL")
API_KEY = os.getenv("API_KEY")
WEBHOOK_SECRET_KEY = os.getenv("WEBHOOK_SECRET_KEY")
WELCOME_ROOM_ID = os.getenv("WELCOME_ROOM_ID")
HR_FOLDER_ID = os.getenv("HR_FOLDER_ID")
NOTIFY_WEBHOOK_URL = os.getenv("NOTIFY_WEBHOOK_URL")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")


def verify_signature(secret_key: str, payload: bytes, signature: str) -> bool:
    computed_hash = hmac.new(secret_key.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={computed_hash}", signature)


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
    if event != "user.invited":
        return JSONResponse(content={"message": "Event ignored"}, status_code=200)

    user = payload.get("payload", {})
    full_name = user.get("userName") or f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
    email = user.get("email")

    if not full_name or not email:
        raise HTTPException(status_code=400, detail="Missing user information")

    try:
        async with aiohttp.ClientSession() as session:

            # Step 1: Grant access to Welcome Room
            welcome_share_url = f"{PORTAL_URL}/api/2.0/files/rooms/{WELCOME_ROOM_ID}/share"
            share_payload = {
                "shareTo": {"email": email},
                "access": 2
            }
            headers = {
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            }
            async with session.post(welcome_share_url, json=share_payload, headers=headers) as share_resp:
                if share_resp.status != 200:
                    raise Exception(f"Failed to grant Welcome Room access: {await share_resp.text()}")

            print(f"Access granted to Welcome Room for {email}")

            # Step 2: Create personal folder in HR if needed
            list_folders_url = f"{PORTAL_URL}/api/2.0/files/{HR_FOLDER_ID}/list"
            async with session.get(list_folders_url, headers={"Authorization": f"Bearer {API_KEY}"}) as folders_resp:
                folders_data = await folders_resp.json()
                existing_folders = folders_data.get("response", [])

            folder_exists = any(item.get("folder") and item.get("title") == full_name for item in existing_folders)
            new_folder_id = None

            if not folder_exists:
                create_folder_url = f"{PORTAL_URL}/api/2.0/files/folder/{HR_FOLDER_ID}"
                create_payload = {"title": full_name}
                async with session.post(create_folder_url, json=create_payload, headers=headers) as create_resp:
                    if create_resp.status != 200:
                        raise Exception(f"Failed to create folder: {await create_resp.text()}")
                    created_folder = await create_resp.json()
                    new_folder_id = created_folder.get("response", {}).get("id")

                print(f"Created personal folder for {full_name}")

            folder_link = f"{PORTAL_URL}/folder/{new_folder_id}" if new_folder_id else "already exists"

            # Step 3: Notify admin
            notify_payload = {
                "to": ADMIN_EMAIL,
                "subject": f"User invited: {full_name}",
                "message": f"A new user has been invited to DocSpace.\n\nName: {full_name}\nEmail: {email}\nFolder: {folder_link}"
            }
            async with session.post(NOTIFY_WEBHOOK_URL, json=notify_payload, headers={"Content-Type": "application/json"}) as notify_resp:
                if notify_resp.status != 200:
                    raise Exception(f"Failed to notify admin: {await notify_resp.text()}")

            print(f"Admin notified about {email}")
            return JSONResponse(content={"message": "Success"}, status_code=200)

    except Exception as e:
        print(f"Error in user.invited handler: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
