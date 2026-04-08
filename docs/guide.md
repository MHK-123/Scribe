# Scribe Installation Guide

Welcome to the **Scribe** setup guide. Follow these steps to set up the bot and dashboard on your server infrastructure.

---

## Prerequisites
- **Node.js** (v18+) - For the Backend API and Web Dashboard.
- **Python** (v3.10+) - For the Discord Bot.
- **PostgreSQL** - Database to store user and server configuration.
- **Git** - For versioning and deployment.

---

## Discord Developer Portal
Before starting the code, you must create a Discord Application:
1. **Enable Intents**: Navigate to the `Bot` tab and enable **all Privileged Gateway Intents** (Presence, Server Members, Message Content).
2. **OAuth2 Redirects**: Add your backend OAuth callback URL (e.g., `https://scribe-backend.onrender.com/auth/callback` or `http://localhost:3000/auth/callback`) to the OAuth2 Redirect list.
3. **Bot Scopes**: Select `bot` and `applications.commands` in the URL generator.
4. **Permissions**: Require `Administrator` permissions.

---

## Database Schema
Initialize your PostgreSQL database with the following structure:

```sql
CREATE TABLE IF NOT EXISTS guild_configs (
    guild_id TEXT PRIMARY KEY,
    join_to_create_channel TEXT,
    temp_vc_category TEXT,
    default_user_limit INTEGER DEFAULT 0,
    auto_delete_empty BOOLEAN DEFAULT TRUE,
    vc_name_template TEXT DEFAULT '{username}''s Room',
    top1_role_id TEXT,
    top2_role_id TEXT,
    top3_role_id TEXT,
    top10_role_id TEXT,
    reset_timezone TEXT DEFAULT 'Asia/Kolkata',
    last_reset_month TEXT,
    bot_command_channel_id TEXT
);

CREATE TABLE IF NOT EXISTS user_levels (
    user_id TEXT,
    guild_id TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    study_seconds INTEGER DEFAULT 0,
    last_study_timestamp TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, guild_id)
);

CREATE TABLE IF NOT EXISTS study_role_rewards (
    id SERIAL PRIMARY KEY,
    guild_id TEXT,
    required_hours INTEGER,
    role_id TEXT,
    UNIQUE(guild_id, required_hours)
);
```

---

## Environment Variables

### Backend (`/backend/.env`)
```env
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/scribe
DISCORD_CLIENT_ID=YOUR_ID
DISCORD_CLIENT_SECRET=YOUR_SECRET
DISCORD_OAUTH_REDIRECT_URI=https://scribe-backend.onrender.com/auth/callback
JWT_SECRET=super_secret_token_here
FRONTEND_URL=https://scribe-azure.vercel.app
```

### Bot (`/.env` or Render settings)
```env
DISCORD_TOKEN=YOUR_BOT_TOKEN
DATABASE_URL=postgres://user:pass@localhost:5432/scribe
VITE_API_URL=https://scribe-backend.onrender.com
PORT=10000
```

### Frontend (`/frontend/.env` or Vercel settings)
```env
VITE_API_URL=https://scribe-backend.onrender.com
```

---

## Core Features

### User Operations
- `/pomodoro-create [focus] [break]` - Start a custom pomodoro timer in any voice channel.
- `/vc-rename [name]` - Rename your active temporary voice channel.
- `/vc-lock` / `/vc-unlock` - Control join access to your channel.
- `.m` - Profile: View your Player Card.
- `.l` - Leaderboard: View the top users in the server.
- `.help` - Open the bot help interface.

### Automated Systems
- **Presence Tracking**: Accurate voice channel tracking ensures users don't receive ghost pings after leaving early.
- **Auto-Stop**: Sessions immediately stop when the last user exits the channel.
- **Voice Activation**: Join a configured channel to automatically start a timer interface.
- **XP Tracking**: Automatically earn experience points every minute while active in a study channel.
- **Role Mastery**: Receive configured Discord roles automatically upon reaching required levels.

---

## Startup Instructions

1. **Backend**: 
   ```bash
   cd backend
   npm install
   node server.js
   ```
2. **Frontend**: 
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Bot**: 
   ```bash
   pip install -r requirements.txt
   python main.py
   ```
