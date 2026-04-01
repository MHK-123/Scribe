# 🛡️ SCRIBE • INSTALLATION MANIFEST

Welcome to the **Scribe Engine** setup protocol. Follow these ancient steps to manifest the Core Sanctum within your own server infrastructure.

---

## 🏗️ PREREQUISITES
- **Node.js** (v18+) - For the Backend & Dashboard.
- **Python** (v3.10+) - For the Scribe Bot.
- **PostgreSQL** - To store Hunter essence and guild scrolls.
- **Git** - For versioning and deployment.

---

## 🗝️ DISCORD DEVELOPER PORTAL
Before initializing the source, you must create a Discord Application:
1. **Enable Intents**: Navigate to the `Bot` tab and enable **all Privileged Gateway Intents** (Presence, Server Members, Message Content).
2. **OAuth2 Redirects**: Add your Dashboard URL (e.g., `http://localhost:5173`) to the OAuth2 Redirect list.
3. **Bot Scopes**: `bot`, `applications.commands`.
4. **Permissions**: `Administrator` (recommended for full dungeon control).

---

## 💾 DATABASE SCHEMA
Initialize your PostgreSQL database with the following structure:

```sql
CREATE TABLE IF NOT EXISTS guild_configs (
    guild_id TEXT PRIMARY KEY,
    join_to_create_channel TEXT,
    temp_vc_category TEXT,
    default_user_limit INTEGER DEFAULT 0,
    auto_delete_empty BOOLEAN DEFAULT TRUE,
    vc_name_template TEXT DEFAULT '{username}''s Dungeon',
    top1_role_id TEXT,
    top2_role_id TEXT,
    top3_role_id TEXT,
    top10_role_id TEXT,
    reset_timezone TEXT DEFAULT 'Asia/Kolkata',
    last_reset_month TEXT
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

## 🕯️ ENVIRONMENT CONFIGURATION

### Backend (`/backend/.env`)
```env
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/scribe
DISCORD_CLIENT_ID=YOUR_ID
DISCORD_CLIENT_SECRET=YOUR_SECRET
DISCORD_OAUTH_REDIRECT_URI=http://localhost:5173
JWT_SECRET=super_secret_token
VITE_API_URL=http://localhost:3000
```

### Bot (`/.env`)
```env
DISCORD_TOKEN=YOUR_BOT_TOKEN
DATABASE_URL=postgres://user:pass@localhost:5432/scribe
VITE_API_URL=http://localhost:3000
```

### Frontend (`/frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_DISCORD_CLIENT_ID=YOUR_ID
```

---

## ⚔️ COMMAND COMPENDIUM

### 🏹 HUNTER OPERATIONS (Slash)
- `/hunter-rank` - View your level, XP, and study duration.
- `/leaderboard` - View the top global or local Hunters.
- `/pomo-setup` - Configure the Scribe Engine for a specific VC.

### 🛡️ ADMIN NODES (Prefix: `.`)
- `.sync` - Propagate all slash commands globally.
- `.sync-guild` - Force sync commands to the current server.
- `.help` - Open the System Help interface.

### ⌛ SCRIBE ENGINE (Automated)
- **HUD Activation**: Join a configured VC to trigger the Pomodoro HUD.
- **XP Pulse**: Earn leveling essence every minute while active in a study VC.
- **Role Mastery**: Automatically receive Discord roles upon hitting study milestones.

---

## 🚀 STARTUP PROTOCOL

1. **Backend**: 
   ```bash
   cd backend && npm install && npm start
   ```
2. **Frontend**: 
   ```bash
   cd frontend && npm install && npm run dev
   ```
3. **Bot**: 
   ```bash
   pip install -r bot/requirements.txt
   python bot/bot.py
   ```

---
**SCRIBE CORE • ACCESS GRANTED • EST. 2026**
