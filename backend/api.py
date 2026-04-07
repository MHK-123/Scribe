from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
import httpx
import os
import jwt
from datetime import datetime, timedelta

router = APIRouter()

# ─── SCRIBE CORE ──────────────────────────────────────────────────────────────
# Resilient OAuth Handshake Logic (FastAPI Transition)
# Ensures zero-friction identity manifest between Discord and Scribe.

# 🛡️ Gateway Configuration
# REDIRECT_URI MUST MATCH DISCORD PORTAL EXACTLY (Strict Signature check)
CLIENT_ID     = os.getenv("DISCORD_CLIENT_ID")
CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
REDIRECT_URI  = "https://scribe-1r8k.onrender.com/auth/callback"
FRONTEND_URL  = os.getenv("FRONTEND_URL", "https://scribe-azure.vercel.app")
JWT_SECRET    = os.getenv("JWT_SECRET", "scribe_ritual_secret_v3")

@router.get("/auth/login")
async def login():
    """Initial Summoning: Redirects user to Discord for authorization."""
    # Note: scopes must be space-separated and URL encoded (identify guilds)
    url = (
        f"https://discord.com/api/oauth2/authorize"
        f"?client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=identify%20guilds"
    )
    return RedirectResponse(url)

@router.get("/auth/user")
async def get_user(request: Request):
    """Manifestation Verification: Allows the frontend to verify the identity manifest."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No identity manifest detected")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {"user": payload}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Identity manifest corrupted")

@router.get("/auth/callback")
async def callback(code: str = None, error: str = None):
    """Manifestation Point: Exchanges Discord code for identity manifests."""
    
    # 🛡️ Path Hardening: Ensure no double slashes on redirect
    base_frontend = FRONTEND_URL.rstrip("/")

    if error or not code:
        print(f"⚠️ [HANDSHAKE ERROR]: Discord returned error: {error}")
        return RedirectResponse(f"{base_frontend}/?error=auth_failed")

    async with httpx.AsyncClient(timeout=15.0) as client:
        # 2. Token Exchange Ritual (Form Data Manifest)
        data = {
            "client_id": str(CLIENT_ID).strip(),
            "client_secret": str(CLIENT_SECRET).strip(),
            "grant_type": "authorization_code",
            "code": code.strip(),
            "redirect_uri": REDIRECT_URI
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "ScribeBot/1.0"
        }
        
        try:
            token_res = await client.post("https://discord.com/api/oauth2/token", data=data, headers=headers)
            
            if token_res.status_code != 200:
                print(f"❌ [EXCHANGE FAILED]: Status {token_res.status_code} - Ritual text: {token_res.text}")
                return RedirectResponse(f"{base_frontend}/?error=auth_failed")
                
            token_data = token_res.json()
            access_token = token_data.get("access_token")

            # 3. User Identity Fetch
            user_res = await client.get("https://discord.com/api/users/@me", headers={
                "Authorization": f"Bearer {access_token}"
            })
            if user_res.status_code != 200:
                print(f"❌ [IDENTITY FETCH FAILED]: {user_res.text}")
                return RedirectResponse(f"{base_frontend}/?error=auth_failed")
                
            user_data = user_res.json()

            # 4. JWT Manifest Generation
            payload = {
                "id": str(user_data["id"]),
                "username": user_data["username"],
                "avatar": user_data.get("avatar"),
                "exp": datetime.utcnow() + timedelta(days=7)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

            print(f"✅ [IDENTITY ANCHORED]: {user_data['username']} has materialized.")
            return RedirectResponse(f"{base_frontend}/servers?token={token}")
            
        except Exception as e:
            print(f"💀 [HANDSHAKE FATAL]: {e}")
            return RedirectResponse(f"{base_frontend}/?error=auth_failed")
