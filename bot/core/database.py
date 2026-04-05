import asyncio
import asyncpg
from bot.utils.logger import bot_logger
from bot.config import DATABASE_URL, Settings

pool = None

async def init_db():
    """
    Initializes the asyncpg connection pool with exponential backoff retry logic.
    """
    global pool
    retries = 5
    delay = 2

    for attempt in range(retries):
        try:
            bot_logger.info(f"Attempting to connect to the database (Attempt {attempt + 1}/{retries})...")
            # ─── Connection Node: Absolute Wait Threshold (10s) ───────────────────
            pool = await asyncio.wait_for(
                asyncpg.create_pool(
                    DATABASE_URL, 
                    min_size=Settings.MIN_DB_POOL, 
                    max_size=Settings.MAX_DB_POOL,
                    command_timeout=60
                ),
                timeout=10.0
            )
            bot_logger.info("⚔️ [STATUS]: Database Manifested.")
            return pool
        except asyncio.TimeoutError:
            bot_logger.error(f"❌ [STATUS]: Database Connection Timed Out (10s) on Attempt {attempt + 1}.")
            if attempt < retries - 1:
                await asyncio.sleep(delay)
                delay *= 2
            else:
                raise
        except Exception as e:
            bot_logger.error(f"Database connection failed: {e}")
            if attempt < retries - 1:
                bot_logger.warning(f"Retrying in {delay} seconds...")
                await asyncio.sleep(delay)
                delay *= 2  # Exponential backoff
            else:
                bot_logger.critical("Failed to connect to the database after all retries. The bot may crash or lose functionality.")
                raise e

def get_pool():
    if not pool:
        bot_logger.warning("get_pool called before pool was initialized!")
    return pool
