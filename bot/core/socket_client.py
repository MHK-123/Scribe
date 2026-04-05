import socketio
import asyncio
from bot.utils.logger import bot_logger
from bot.config import API_URL

sio = socketio.AsyncClient(
    reconnection=True, 
    reconnection_attempts=10, 
    reconnection_delay=5,
    reconnection_delay_max=60
)

async def connect_socketIO():
    """Attempt initial connection with the backend"""
    try:
        bot_logger.info(f"Connecting to Socket.IO backend at {API_URL}...")
        await sio.connect(API_URL)
    except Exception as e:
        bot_logger.error(f"Initial Socket.IO connection failed: {e}. Will continue without real-time and rely on auto-reconnect pinging.")

async def safe_emit(event: str, data: dict):
    """Emit a Socket.IO event only if the client is connected, to avoid silent drops or exceptions."""
    if sio.connected:
        try:
            await sio.emit(event, data)
            bot_logger.debug(f"Emitted event: {event}")
        except Exception as e:
            bot_logger.error(f"Socket emit error ({event}): {e}")
    else:
        bot_logger.warning(f"Attempted to emit '{event}' but Socket.IO is disconnected.")

# The event handlers (process_monthly_roles, request_guild_sync, guild_monthly_reset)
# will be registered in main.py or a dedicated module to prevent circular imports with 'bot' instance.
