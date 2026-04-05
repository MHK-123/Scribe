# ⚔️ Scribe Bot - Dungeon Study Ecosystem

Scribe is a highly cohesive, robust Discord bot engineered to gamify voice channels. It transforms normal studying into an RPG "Dungeon" experience with Pomodoro timers, dynamic experience (XP) allocation, interactive leaderboards, and an integrated Web Dashboard.

## ✨ Features
- **Dynamic Dungeon Generation (Temp VCs)**: Users join an anchor channel to instantly spawn their own protected Voice Channels.
- **Scribe Pomodoro Engine**: Deep Discord integration. Synchronized HUDs across VCs with animated embed interfaces that provide Focus and Break phases with active group detection.
- **Mana / XP Tracking System**: Realtime tracking of seconds spent studying in dungeons, awarding role-based rewards directly injected by the PostgreSQL backend.
- **Modular Microservice Architecture**: The ecosystem is split into a React/Vite dashboard, an Express/NodeJS API, and this async Python Discord Bot instance.
- **Resilient Heartbeat**: Auto-healing Socket.IO event system and integrated Health Check Web Server for 24/7 free hosting (e.g., Render/Koyeb).

## 🛠️ Tech Stack
- **Core Bot**: Python 3.10+, `discord.py` (v2)
- **Database**: PostgreSQL (via `asyncpg` connection pools)
- **WebSockets**: `python-socketio[asyncio]`
- **Frontend / Backend Interactions**: Axios, Express, Vite, React (Not included in this bot folder, but powers the dashboard)

## 📂 Folder Architecture

Scribe has been engineered with a scalable, production-ready `Cog` architecture:
```text
bot/
├── main.py                    # The central entry point (Bootstrap & Error Handling)
├── config.py                  # Global configurations and Env variables
├── core/
│   ├── database.py            # Advanced asyncpg Pool with Auto-Retry Logic
│   └── socket_client.py       # Socket.IO event handlers and backoff logic
├── cogs/
│   ├── admin.py               # Owner-Specific Override Commands
│   ├── pomodoro.py            # Pomodoro Slash Commands (/pomo-setup)
│   ├── stats_hunter.py        # XP system rendering (/leaderboard, /profile)
│   └── voice.py               # Temporary VC Auto-Creation & Deletion routines
├── services/
│   └── pomodoro_manager.py    # Standalone Business Logic for Pomodoro Lifecycle
└── utils/
    ├── embeds.py              # Centralized UI System for generating matching embed aesthetics
    └── logger.py              # Thread-safe global rotational File/Console logger
```

---

## ⚙️ Environment Variables (`.env`)

You must construct a `.env` file within the `bot/` directory before starting the sanctum.
```env
# Discord Settings
DISCORD_TOKEN="YOUR_DISCORD_BOT_TOKEN_HERE"

# Database Configuration (Postgres)
DATABASE_URL="postgres://user:password@host/database_name?sslmode=require"

# API Integration
VITE_API_URL="http://localhost:3000" # URL of the Express Backend for Realtime Events

# Network Binding (Provided dynamically by Render usually)
PORT="10000" 
```

---

## 🚀 Setup Instructions

### How to Run Locally

1. **Install Python Requirements**: Ensure Python 3.10+ is installed.
   ```bash
   cd bot
   pip install -r requirements.txt
   ```
2. **Setup the Environment**: Create `.env` and fill the variables.
3. **Boot the Core**: 
   ```bash
   python main.py
   ```
4. **Logs Check**: Look into `./logs/bot.log` to confirm Database and Socket.IO initialization.

### How to Deploy (Render / VPS)

**Render (Web Service - Recommended)**
Render provides standard continuous deployment. Because this bot hooks into an idle sleep timer, we integrated an automatic keep-alive server.
1. Connect this GitHub Repository to Render via a New **Web Service** (Not Background Worker).
2. Set Build Command: `pip install -r bot/requirements.txt`
3. Set Start Command: `cd bot && python main.py`
4. Define your Environment Variables securely in the Render GUI.
5. Create a free account on [UptimeRobot](https://uptimerobot.com) and point an HTTP `GET` request ping to your Render `https://bot-domain.onrender.com` every 10 minutes to prevent the bot from shutting down!

**Docker (Optional)**
If migrating to an unmanaged VPS:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```
*(Build via `docker build -t scribe-bot .` and run passing `.env` using `--env-file`)*

---
*“Venture deep, study well, and fear not the darkness. The Scribe engine protects its hunters.”*
