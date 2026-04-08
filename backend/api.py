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
        try:
            print("🔮 [DB POOL]: Igniting the Sanctuary Library connection (Timeout: 5s)...")
            # Anchor: Use a 5s timeout to prevent infinite hanging Rifts
            db_pool = await asyncpg.create_pool(DATABASE_URL, command_timeout=5.0, connect_timeout=5.0)
        except Exception as e:
            print(f"⚠️ [DB POOL FAIL]: Sanctuary Library is unreachable: {e}")
            db_pool = "FAILED" # Mark as failed to prevent re-trying every second
    return db_pool if db_pool != "FAILED" else None

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

