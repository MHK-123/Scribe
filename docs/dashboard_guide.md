# Dashboard Guide

Welcome to the **Dashboard Guide**. This guide details how to configure and manage your server settings via the Scribe web platform.

---

## 1. Settings
*The core configuration for your server.*

### Ritual Setup Manifest (Stabilized)
-   **Step-by-Step Manifestation**: A multi-stage wizard ensures your server infrastructure (VCs, Categories, Focus Timers, and Rewards) is built without ley-line failures.
-   **Validation**: Every node is verified in real-time before moving to the next cycle.

### Bot Command Channel
- **Functionality**: Use this to designate a **single channel** where commands like `.l` and `.m` are allowed.
- **Default Security**: If the bot cannot reach the database, it will **block** the command by default to prevent issues. 
- **Universal Enforcement**: This restriction applies to all users, including Administrators. If used elsewhere, Scribe will delete the command and send a DM instead.
- **Tip**: This keeps your general chat channels clean.

### Backup & Restore
- **Backup**: Saves your entire server configuration (VC patterns, Pomodoro settings, Rewards) into a backup file.
- **Restore**: Instantly apply a previously saved configuration to recover your settings.

---

## 2. Pomodoro Timer
*Automated focus sessions.*

### Tracking Accuracy 
- **Accurate Presence**: Scribe strictly tracks voice channel presence. Users must be inside the voice channel at the moment of phase transition to be notified. If you leave the channel, you will not receive any ghost pings.
- **Auto-Stop**: The timer stops and collapses the session **immediately** when the last user leaves the channel. This ensures no timers run in empty rooms.
- **Minimalist UI**: The visual interface has been simplified for a clean, distraction-free experience.

### Configuration
- **Accurate Sync Logic**: State synchronization ensures dashboard values (like cycle counts) never revert to old data.
- **Focus / Break Duration**: Set your study blocks (e.g., 50m Focus / 10m Break).
- **Cycles**: 
    - **1–100**: Fixed study session length.
    - **0**: Continuous mode for 24/7 study rooms.
- **Manual Start**: Users can use `/pomodoro-create` to start a custom timer in any voice channel at any time.

---

## 3. Temporary Voice Channels
*Dynamic voice channels that are created and deleted as needed.*

### Join-to-Create
- **Creation**: When a user joins the "Hub" channel, the bot creates a new private channel for them and moves them into it.
- **Naming Pattern**: Use patterns like `{username}'s Room` to automatically name the channels.
- **User Limit**: Set a default maximum capacity for the channels.

---

### Hunter Ranks
- **Global Identity**: Plain usernames are now superseded by **Hunter Ranks** (S, A, B, C) based on your global standing and level.
- **Visual Distinction**: Ranks feature unique thematic glows and branding in the Leaderboard and Dashboard Header.

### Leaderboard
- **Top Hunters**: View the ranking of the most prestigious students in your sanctuary.
- **Rank Labels**: Users are primarily identified by their Hunter Rank rather than just their username.

---

## 5. Quick Commands

- **`.m` (Profile)**: Shows the user's Player Card, current Level, Total XP, and Study Hours.
- **`.l` (Leaderboard)**: Displays the top 10 users in the server.
- **`.help`**: Displays the bot help interface.

---

## 6. Troubleshooting
- **Reverting Values**: If a value looks incorrect in the dashboard, perform a **Hard Refresh (Ctrl + F5)**. 
- **Commands Not Working**: Check if the bot has **Administrator** permissions and if you are typing them in the **correct restricted channel**.
- **Timer Not Appearing**: Ensure the linked **Text Channel** allows the bot to "Send Messages" and "Embed Links".

> [!IMPORTANT]
> **Links**: The Scribe Landing Page is at [https://scribe-azure.vercel.app/](https://scribe-azure.vercel.app/). To access the control panel, navigate to [https://scribe-azure.vercel.app/servers](https://scribe-azure.vercel.app/servers).
