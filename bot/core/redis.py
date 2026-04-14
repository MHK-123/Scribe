import os
import json
import redis.asyncio as redis
from bot.config import REDIS_URL
from bot.utils.logger import bot_logger

class RedisClient:
    def __init__(self):
        self.client = None
        self.url = REDIS_URL

    async def connect(self):
        if not self.url:
            bot_logger.warning("⚠️ [REDIS]: No URL found. Real-time scrying is disabled.")
            return

        try:
            self.client = redis.from_url(self.url, decode_responses=True)
            await self.client.ping()
            bot_logger.info("📡 [REDIS]: Connection manifested successfully.")
        except Exception as e:
            bot_logger.error(f"❌ [REDIS]: Connection ritual failed: {e}")
            self.client = None

    async def set_active_vcs(self, guild_id: str, count: int):
        if not self.client: return
        try:
            await self.client.set(f"bot:active_vcs:{guild_id}", count, ex=600) # 10 min TTL
        except Exception as e:
            bot_logger.error(f"❌ [REDIS]: Failed to sync VC count: {e}")

    async def get_active_vcs(self, guild_id: str):
        if not self.client: return 0
        try:
            val = await self.client.get(f"bot:active_vcs:{guild_id}")
            return int(val) if val else 0
        except:
            return 0

    async def set_bot_heartbeat(self):
        if not self.client: return
        try:
            await self.client.set("bot:heartbeat", "online", ex=300) # 5 min TTL
        except:
            pass

# Global Instance
redis_client = RedisClient()
