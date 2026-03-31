# StudyForge Dashboard & Discord Bot

A fully-featured, auto-leveling study room manager and analytics dashboard for Discord communities. Built with modern web tech.

## Features

### 🎙️ Voice Channel Management
- **Join-to-Create**: Dynamic temporary voice channels that auto-delete when empty.
- **Custom Templates**: Configurable VC name templates per server (e.g. `{username}'s Dungeon`).

### ⚔️ XP & Leveling System
- **Auto-Leveling**: Earns users XP for every minute spent in voice channels (10 XP/min).
- **Pomodoro XP**: Focus phases also award XP and study hours at the same rate, counting toward the same `user_levels` leaderboard.
- **Level Formula**: `level = floor(sqrt(total_xp / 100))`
- **Role Rewards**: Admins map study hour milestones to Discord roles — assigned automatically.

### 🍅 Pomodoro Focus System
- **Session Panel**: Live dungeon-themed embed with progress bar, countdown, and control buttons.
- **Auto-Start / Auto-Stop**: Sessions trigger when a user joins a configured VC and stop when empty.
- **Phase Announcements**: New message pinging every VC member on each focus ↔ break transition.
- **Quick Presets**: Classic (25/5), Deep Work (50/10), Intense (90/15) — one click to configure.
- **Config Limit**: Maximum 5 Pomodoro configs per server.

### 📊 Analytics Dashboard
- Real-time study hour tracking, daily concurrent learners, monthly leaderboards.
- Socket.IO live updates. Monthly top-10 role assignment via backend scheduler.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React + Vite + TailwindCSS + Framer Motion |
| Backend  | Node.js + Express + Socket.IO           |
| Bot      | Python + discord.py                     |
| Database | PostgreSQL (asyncpg / pg)               |

---

## 🚀 Deployment Guide — Vercel + Render only

Everything runs on **two platforms** plus a free database. No Railway needed.

```
Neon (PostgreSQL)  ← shared by both services
      │
      ├── Render  →  Backend API  (Web Service, Node.js)
      │           →  Discord Bot  (Background Worker, Python)
      │
      └── Vercel  →  Frontend     (Static, React/Vite)
```

---

### Step 1: Database — Neon (free)

1. Create a free account at [neon.tech](https://neon.tech).
2. Create a new project and copy the **Connection String** (starts with `postgresql://`).
3. Open the SQL editor and paste + run the contents of `database/schema.sql`.

> **Supabase** works identically — use the Postgres connection string from **Project Settings → Database**.

---

### Step 2: Render — Backend + Bot (two services, one repo)

The repo includes a `render.yaml` blueprint that defines both services automatically.

#### Option A — Blueprint (recommended, one-click)

1. Go to [render.com](https://render.com) → **New → Blueprint**.
2. Connect your GitHub repo.
3. Render reads `render.yaml` and creates both services. Click **Apply**.
4. Fill in the environment variables marked as `sync: false` (see table below).

#### Option B — Manual

Create two services manually:

| Setting | Backend | Bot |
|---|---|---|
| **Type** | Web Service | Background Worker |
| **Runtime** | Node | Python |
| **Root Directory** | `backend` | `bot` |
| **Build Command** | `npm install` | `pip install -r requirements.txt` |
| **Start Command** | `node server.js` | `python bot.py` |

#### Environment Variables

**Backend service:**

| Variable | Value |
|---|---|
| `PORT` | `3000` |
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | Any long random string (Render can auto-generate) |
| `FRONTEND_URL` | Your Vercel URL (fill in after Step 3) |
| `DISCORD_CLIENT_ID` | From Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | From Discord Developer Portal |
| `DISCORD_OAUTH_REDIRECT_URI` | `https://<your-backend>.onrender.com/auth/callback` |

**Bot Background Worker:**

| Variable | Value |
|---|---|
| `DISCORD_TOKEN` | Your bot token |
| `DATABASE_URL` | Same Neon connection string |
| `VITE_API_URL` | Your Render backend URL (e.g. `https://<your-backend>.onrender.com`) |

---

### Step 3: Vercel — Frontend

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo.
2. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variables:
   - `VITE_API_URL` → your Render backend URL from Step 2
   - `VITE_DISCORD_CLIENT_ID` → your Discord Client ID
4. Deploy.

---

### Step 4: Discord Developer Portal

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications).
2. **Bot → Privileged Gateway Intents**: enable **Server Members Intent** and **Voice State** (enabled by default).
3. **OAuth2 → General → Redirects**: add `https://<your-backend>.onrender.com/auth/callback`.
4. Save.

---

### Step 5: Link Frontend ↔ Backend

1. Back in Vercel, update `VITE_API_URL` to your live Render backend URL.
2. Back in Render backend service, update `FRONTEND_URL` to your live Vercel URL.
3. Trigger a redeploy on Vercel.

You're fully live — frontend on Vercel, backend + bot on Render. 🚀

---

## ⚠️ Free Tier Notes

| Service | Free Tier Behaviour |
|---|---|
| **Render Web Service** (backend) | Spins down after 15 min of inactivity. First request after sleep takes ~30s to wake up. |
| **Render Background Worker** (bot) | Runs continuously — **does not sleep**. 750 free hours/month (enough for one service). |
| **Neon** | 0.5 GB storage, 1 compute unit — plenty for this workload. |
| **Vercel** | Fully static, always fast, no limits for hobby projects. |

> **Tip**: To keep the backend awake, use [UptimeRobot](https://uptimerobot.com) (free) to ping your Render backend URL every 5 minutes.
