import sys
import os
import time
import threading
import signal
import aiohttp
import inspect

# ─── Scribe Unity Entry Point (v6.0) ─────────────────────────────────────────

# ─── Signature Shield: Resolving AIOHTTP Parameter Collision ──────────────────
# This intelligent proxy dynamically filters out any modern parameters (like 'ws_close')
# that your version of aiohttp doesn't understand, preventing the 'TypeError' crash.
_original_timeout = aiohttp.ClientTimeout
class ResilientTimeout(_original_timeout):
    def __new__(cls, *args, **kwargs):
        params = inspect.signature(_original_timeout).parameters
        filtered = {k: v for k, v in kwargs.items() if k in params}
        return _original_timeout(*args, **filtered)

# Apply the shield globally
aiohttp.ClientTimeout = ResilientTimeout
aiohttp.ClientNSTimeout = ResilientTimeout
aiohttp.ClientWSTimeout = ResilientTimeout

# Force unbuffered output for cleaner VPS logging
sys.stdout.reconfigure(line_buffering=True)

if __name__ == "__main__":
    print("--- [SENTINEL]: SCRIBE VPS IGNITION ---", flush=True)
    
    # 1. Sentinel Manifestation Loop (Exponential Backoff)
    # This loop ensures the bot stays alive even if Discord or the Network blips.
    backoff = 15
    max_backoff = 300 # 10 minutes max backoff
    
    while True:
        try:
            from bot.main import main_entry
            print("🔥 [SENTINEL]: Invoking Bot Core...", flush=True)
            main_entry()
            # If main_entry exits cleanly, we exit the loop.
            break
        except Exception as e:
            error_msg = str(e)
            print(f"💀 [SENTINEL]: Core Ignition Failure: {error_msg}", flush=True)
            
            # 2. Global Rate Limit Detection (429)
            if "429" in error_msg or "rate limit" in error_msg.lower():
                print(f"⏳ [SENTINEL]: Discord Global Rate Limit detected. Engaging extended cooldown (120s)...", flush=True)
                time.sleep(120)
                backoff = 30 
            else:
                print(f"⏳ [SENTINEL]: Restarting in {backoff}s...", flush=True)
                time.sleep(backoff)
                backoff = min(backoff * 2, max_backoff)
            
            print("🔄 [SENTINEL]: Commencing Ignition Retry...", flush=True)
            import importlib
            import bot.main
            importlib.reload(bot.main)
