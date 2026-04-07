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
DISCORD_TOKEN = os.getenv("TOKEN") # Bot Manifest Token

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
    """Manifestation Verification: Returns the identity manifest."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No identity manifest detected")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        # Return only public data to the frontend
        return {"user": {
            "id": payload["id"],
            "username": payload["username"],
            "avatar": payload.get("avatar")
        }}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Identity manifest corrupted")

@router.get("/guilds")
async def get_guilds(request: Request):
    """Realm Vision: Fetches and filters the user's managed sanctuaries."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        access_token = payload.get("access_token")
    except:
        raise HTTPException(status_code=401, detail="Invalid session")

    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Fetch User Guilds
        user_guilds_res = await client.get("https://discord.com/api/users/@me/guilds", headers={
            "Authorization": f"Bearer {access_token}"
        })
        if user_guilds_res.status_code != 200:
            return []

        # 2. Fetch Bot Guilds (Presence Check)
        bot_guilds_res = await client.get("https://discord.com/api/users/@me/guilds", headers={
            "Authorization": f"Bot {DISCORD_TOKEN}"
        })
        bot_guild_ids = [g["id"] for g in bot_guilds_res.json()] if bot_guilds_res.status_code == 200 else []

        # 3. Filtering Manifestation (Manage Server 0x20 or Administrator 0x8)
        MANAGE_GUILD = 0x20
        ADMINISTRATOR = 0x8
        
        filtered = []
        for g in user_guilds_res.json():
            perms = int(g["permissions"])
            if (perms & MANAGE_GUILD) == MANAGE_GUILD or (perms & ADMINISTRATOR) == ADMINISTRATOR:
                filtered.append({
                    "id": g["id"],
                    "name": g["name"],
                    "icon": g.get("icon"),
                    "icon_url": f"https://cdn.discordapp.com/icons/{g['id']}/{g['icon']}.png" if g.get("icon") else None,
                    "is_installed": g["id"] in bot_guild_ids
                })
        
        return filtered

@router.get("/auth/callback")
async def callback(code: str = None, error: str = None):
    """Manifestation Point: Exchanges Discord code for identity manifests."""
    
    base_frontend = FRONTEND_URL.rstrip("/")

    if error or not code:
        return RedirectResponse(f"{base_frontend}/?error=auth_failed")

    async with httpx.AsyncClient(timeout=15.0) as client:
        data = {
            "client_id": str(CLIENT_ID).strip(),
            "client_secret": str(CLIENT_SECRET).strip(),
            "grant_type": "authorization_code",
            "code": code.strip(),
            "redirect_uri": REDIRECT_URI
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        try:
            token_res = await client.post("https://discord.com/api/oauth2/token", data=data, headers=headers)
            if token_res.status_code != 200:
                print(f"❌ [EXCHANGE FAILED]: {token_res.text}")
                return RedirectResponse(f"{base_frontend}/?error=auth_failed")
                
            token_data = token_res.json()
            access_token = token_data.get("access_token")

            # Fetch Identity
            user_res = await client.get("https://discord.com/api/users/@me", headers={
                "Authorization": f"Bearer {access_token}"
            })
            if user_res.status_code != 200:
                return RedirectResponse(f"{base_frontend}/?error=auth_failed")
                
            user_data = user_res.json()

            # JWT Manifest (Anchoring access_token for backend API calls)
            payload = {
                "id": str(user_data["id"]),
                "username": user_data["username"],
                "avatar": user_data.get("avatar"),
                "access_token": access_token,
                "exp": datetime.utcnow() + timedelta(days=7)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

            return RedirectResponse(f"{base_frontend}/servers?token={token}")
            
        except Exception as e:
            print(f"💀 [HANDSHAKE FATAL]: {e}")
            return RedirectResponse(f"{base_frontend}/?error=auth_failed")
