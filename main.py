import sys
import os
import time
import threading
import signal
import aiohttp
import inspect
from http.server import HTTPServer, BaseHTTPRequestHandler

# ─── Scribe Universal Launcher (v6.1 - Hybrid) ────────────────────────────────

# Force unbuffered output

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

# ─── Render Presence (Health Check) ───────────────────────────────────────────
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"Scribe Hybrid Sentinel: Operational")
    def do_HEAD(self):
        self.send_response(200)
        self.end_headers()
    def log_message(self, format, *args):
        return  # Silence logs for clean VPS streams

def run_health_check(port):
    try:
        server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
        print(f"📡 [SENTINEL]: Ritual space secured on port {port} (Render Mode)", flush=True)
        server.serve_forever()
    except Exception as e:
        print(f"⚠️ [SENTINEL]: Port binding failure: {e}", flush=True)

if __name__ == "__main__":
    print("--- [SENTINEL]: SCRIBE UNIFIED IGNITION ---", flush=True)
    
    # 1. Render/Cloud Compatibility: Fire health check only if PORT is present
    render_port = os.getenv("PORT")
    if render_port:
        threading.Thread(target=run_health_check, args=(int(render_port),), daemon=True).start()
    else:
        print("🛡️ [SENTINEL]: No PORT detected. Running in Native VPS mode.", flush=True)

    # 2. Resilient Manifestation Loop (Exponential Backoff)
    backoff = 15
    max_backoff = 300 
    
    while True:
        try:
            from bot.main import main_entry
            print("🔥 [SENTINEL]: Invoking Bot Core...", flush=True)
            main_entry()
            break
        except Exception as e:
            error_msg = str(e)
            print(f"💀 [SENTINEL]: Core Ignition Failure: {error_msg}", flush=True)
            
            # 3. Global Rate Limit Detection (429)
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
