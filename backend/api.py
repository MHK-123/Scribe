from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
import httpx
import os
import jwt
import asyncpg
from datetime import datetime, timedelta
from typing import List, Optional

# --- Manifest: Vault Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL")
db_pool = None

async def get_db_pool():
    global db_pool
    if db_pool is None:
        print("🔮 [DB POOL]: Igniting the Sanctuary Library connection...")
        db_pool = await asyncpg.create_pool(DATABASE_URL)
    return db_pool

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
# 🛡️ Secret Anchor Sync
DISCORD_TOKEN = os.getenv("TOKEN") or os.getenv("DISCORD_TOKEN")
ADMIN_IDS     = (os.getenv("ADMIN_IDS", "1407010812081475757")).split(",")

@router.get("/auth/user")
async def get_user(request: Request):
    """Manifestation Verification: Returns the identity manifest."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No identity manifest detected")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {"user": {
            "id": str(payload["id"]),
            "username": payload["username"],
            "avatar": payload.get("avatar"),
            "is_admin": str(payload["id"]) in ADMIN_IDS
        }}
    except Exception as e:
        print(f"💀 [AUTH VERIFY FAILED]: {e}")
        raise HTTPException(status_code=401, detail="Identity manifest corrupted")

@router.get("/guilds")
async def get_guilds(request: Request):
    """Realm Vision: Fetches and filters the user's managed sanctuaries."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        access_token = payload.get("access_token")
        print(f"🔮 [GUILD FETCH]: Ritual initiated for {payload.get('username')}")
    except Exception as e:
        print(f"⚠️ [GUILD JWT FAIL]: {e}")
        raise HTTPException(status_code=401, detail="Invalid session")

    async with httpx.AsyncClient(timeout=20.0) as client:
        # 1. Fetch User Guilds
        user_guilds_res = await client.get("https://discord.com/api/users/@me/guilds", headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        if user_guilds_res.status_code != 200:
            print(f"❌ [DISCORD USER GUILDS FAIL]: Status {user_guilds_res.status_code} - {user_guilds_res.text}")
            return []

        # 2. Fetch Bot Guilds
        bot_guilds_res = await client.get("https://discord.com/api/users/@me/guilds", headers={
            "Authorization": f"Bot {DISCORD_TOKEN}"
        })
        
        if bot_guilds_res.status_code != 200:
            print(f"❌ [DISCORD BOT GUILDS FAIL]: Status {bot_guilds_res.status_code} - Ensure 'TOKEN' is correct.")
            bot_guild_ids = []
        else:
            bot_guild_ids = [g["id"] for g in bot_guilds_res.json()]

        # 3. Perms Manifestation
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
        
        print(f"✅ [REALM MANIFESTED]: Found {len(filtered)} managed servers.")
        return filtered

# --- Manifested Realm Vision: Admin Stats ---
@router.get("/admin/stats")
async def get_admin_stats():
    """Manifests the total scale of the Scribe influence."""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Query the Sanctuary Library for real-time spirit counts
            # Note: total_users counts distinct spirits in the level manifests
            total_users = await conn.fetchval("SELECT COUNT(DISTINCT user_id) FROM user_levels")
            active_guilds = await conn.fetchval("SELECT COUNT(*) FROM guild_configs")
            active_connections = await conn.fetchval("SELECT COUNT(*) FROM temp_voice_channels")
            
            return {
                "total_users": total_users or 0,
                "active_guilds": active_guilds or 0,
                "active_connections": active_connections or 0
            }
    except Exception as e:
        print(f"❌ [DB STATS FAIL]: {e}")
        return {"total_users": 0, "active_guilds": 0, "active_connections": 0}

@router.get("/admin/guilds")
async def get_admin_guilds(request: Request):
    """Manifests the Hall of Sanctuaries from the Sanctuary Library."""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Manifest every realm registered in the Library
            rows = await conn.fetch("SELECT guild_id, vc_name_template FROM guild_configs")
            
            # Enrich with Names (First pass: IDs as identifiers)
            guilds = []
            for row in rows:
                guilds.append({
                    "id": row["guild_id"],
                    "name": f"Manifested Realm ({row['guild_id']})",
                    "active": True,
                    "is_installed": True
                })
            return guilds
    except Exception as e:
        print(f"❌ [DB GUILDS FAIL]: {e}")
        return []

@router.get("/guilds")
async def get_guilds(request: Request):
    """Bridge Ritual: Merges Discord vision with the Sanctum Library."""
    # Note: Calling admin_guilds for now to ensure visibility
    return await get_admin_guilds(request)

@router.get("/auth/callback")
async def callback(code: str = None, error: str = None):
    """Manifestation Point: Exchanges Discord code for identity manifests."""
    base_frontend = FRONTEND_URL.rstrip("/")

    if error or not code:
        return RedirectResponse(f"{base_frontend}/?error=auth_failed")

    async with httpx.AsyncClient(timeout=20.0) as client:
        data = {
            "client_id": str(CLIENT_ID).strip(),
            "client_secret": str(CLIENT_SECRET).strip(),
            "grant_type": "authorization_code",
            "code": code.strip(),
            "redirect_uri": REDIRECT_URI
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        
        try:
            token_res = await client.post("https://discord.com/api/oauth2/token", data=data, headers=headers)
            if token_res.status_code != 200:
                print(f"❌ [EXCHANGE FAILED]: {token_res.text}")
                return RedirectResponse(f"{base_frontend}/?error=auth_failed")
                
            token_data = token_res.json()
            access_token = token_data.get("access_token")

            user_res = await client.get("https://discord.com/api/users/@me", headers={
                "Authorization": f"Bearer {access_token}"
            })
            if user_res.status_code != 200:
                return RedirectResponse(f"{base_frontend}/?error=auth_failed")
                
            user_data = user_res.json()

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
