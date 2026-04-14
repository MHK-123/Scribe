import os
from dotenv import load_dotenv

# Load environments
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# ─── SECRETS ───
TOKEN = os.getenv("TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL")
API_URL = os.getenv("API_URL")   # Standardised from VITE_API_URL
REDIS_URL = os.getenv("REDIS_URL")

# ─── THEMES ───
class Theme:
    PRIMARY = 0x4b8bf5     # Blue glow
    ERROR = 0xef4444       # Red glow
    SUCCESS = 0x10b981     # Green glow
    WARNING = 0xf59e0b     # Orange glow
    
    # Text formatters
    @staticmethod
    def error(msg: str) -> str:
        return f"```ansi\n\\u001b[1;31mFAILED:\\u001b[0m {msg}\n```"

# ─── SYSTEM SETTINGS ───
class Settings:
    BACKGROUND_URL = "https://image2url.com/r2/default/images/1775178271151-e0c10ab6-467d-42ba-a714-2802410dc6b2.png"
    HEALTH_PORT = int(os.getenv("PORT", 10000))
    MIN_DB_POOL = 2
    MAX_DB_POOL = 10
