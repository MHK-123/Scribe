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

# 🛡️ Gateway Configuration
CLIENT_ID     = os.getenv("DISCORD_CLIENT_ID")
CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
REDIRECT_URI  = "https://scribe-1r8k.onrender.com/auth/callback"
FRONTEND_URL  = os.getenv("FRONTEND_URL", "https://scribe-azure.vercel.app")
JWT_SECRET    = os.getenv("JWT_SECRET", "scribe_ritual_secret_v3")
# 🛡️ Secret Anchor Sync
DISCORD_TOKEN = os.getenv("TOKEN") or os.getenv("DISCORD_TOKEN")
ADMIN_IDS     = (os.getenv("ADMIN_IDS", "1407010812081475757")).split(",")

async def get_db_pool():
    global db_pool
    if db_pool is None:
        try:
            print("🔮 [DB POOL]: Igniting the Sanctuary Library connection (Timeout: 5s)...")
            # Anchor: Use a 5s timeout to prevent infinite hanging Rifts
            db_pool = await asyncpg.create_pool(DATABASE_URL, command_timeout=5.0, timeout=5.0)
        except Exception as e:
            print(f"⚠️ [DB POOL FAIL]: Sanctuary Library is unreachable: {e}")
            db_pool = "FAILED" 
    return db_pool if db_pool != "FAILED" else None

router = APIRouter()

# ─── RESTORED PRODUCTION HANDLERS ─────────────────────────────────────────────

@router.get("/auth/user")
async def get_user(request: Request):
    """Manifestation Verification: Returns the identity manifest."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No identity manifest detected")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {
            "user": {
                "id": str(payload["id"]),
                "username": payload["username"],
                "avatar": payload.get("avatar"),
                "access_token": payload.get("access_token"),
                "is_admin": str(payload["id"]) in ADMIN_IDS
            }
        }
    except Exception as e:
        print(f"💀 [AUTH VERIFY FAILED]: {e}")
        raise HTTPException(status_code=401, detail="Identity manifest corrupted")

@router.get("/guilds")
async def get_guilds(request: Request):
    """Manifests the Hall of Realms with Absolute High-Fidelity Resilience."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return []

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        access_token = payload.get("access_token")
    except Exception:
        return []

    if not access_token:
        return []

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            u_res = await client.get("https://discord.com/api/users/@me/guilds", headers={
                "Authorization": f"Bearer {access_token}"
            })
            if u_res.status_code != 200:
                print(f"⚠️ [API]: Discord User Manifest failed ({u_res.status_code})")
                return []
            user_guilds = u_res.json()
        except Exception:
            return []

        # Bot Presence Fetch
        bot_guild_ids = set()
        if DISCORD_TOKEN:
            try:
                b_res = await client.get("https://discord.com/api/users/@me/guilds", headers={
                    "Authorization": f"Bot {DISCORD_TOKEN}"
                })
                if b_res.status_code == 200:
                    bot_guild_ids = {str(bg["id"]) for bg in b_res.json()}
            except Exception:
                pass

        # Filter Managed Guilds
        filtered = []
        for g in user_guilds:
            perms = int(g.get("permissions", "0"))
            gid = str(g["id"])
            if g.get("owner") or (perms & 0x08) or (perms & 0x20):
                filtered.append({
                    "id": gid,
                    "name": g["name"],
                    "icon": g.get("icon"),
                    "is_installed": gid in bot_guild_ids,
                    "owner": g.get("owner", False)
                })
        return filtered

@router.get("/auth/callback")
async def callback(code: str = None, error: str = None):
    """Exchanges Discord code for identity manifests."""
    base_frontend = FRONTEND_URL.rstrip("/")
    if error or not code:
        return RedirectResponse(f"{base_frontend}/?error=auth_failed")

    async with httpx.AsyncClient(timeout=15.0) as client:
        data = {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI
        }
        try:
            res = await client.post("https://discord.com/api/oauth2/token", data=data)
            if res.status_code != 200:
                return RedirectResponse(f"{base_frontend}/?error=auth_failed")
            
            token_data = res.json()
            access_token = token_data.get("access_token")

            u_res = await client.get("https://discord.com/api/users/@me", headers={
                "Authorization": f"Bearer {access_token}"
            })
            user_data = u_res.json()

            payload = {
                "id": str(user_data["id"]),
                "username": user_data["username"],
                "avatar": user_data.get("avatar"),
                "access_token": access_token,
                "exp": datetime.utcnow() + timedelta(days=7)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
            return RedirectResponse(f"{base_frontend}/servers?token={token}")
        except Exception:
            return RedirectResponse(f"{base_frontend}/?error=auth_failed")

# ──────────────────────────────────────────────────────────────────────────────

@router.get("/admin/stats")
async def get_admin_stats():
    """Manifests the total scale of the Scribe influence."""
    try:
        pool = await get_db_pool()
        if not pool:
            return {"total_users": 0, "active_guilds": 0, "active_connections": 0}
            
        async with pool.acquire() as conn:
            # Query the Sanctuary Library for real-time spirit counts
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

@router.get("/health")
async def health_check():
    """Sentinel Health Verification."""
    return {"status": "manifested", "gateway": "api-v1", "timestamp": datetime.utcnow()}

