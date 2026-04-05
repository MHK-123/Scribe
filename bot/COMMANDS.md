# 🛡️ Scribe Ecosystem Command Directory

This document outlines all recognized interactive modules within the Scribe Bot ecosystem.

---

## 👤 Member Commands
These commands are available to all Hunters within the server. Note that Voice Channel (`/vc-`) commands require the user to be the **owner** of the temporary voice channel they are currently sitting in.

### 📊 Tracking & Statistics
| Syntax | Application | Action |
|:---|:---|:---|
| `.l` | Prefix | **View the Hunter leaderboard**.<br>Displays the top 10 users ranked by total VC study hours. |
| `.m` | Prefix | **View your Hunter stats**.<br>Generates a "Player Card" image detailing your level, XP, and total hours. |

*Note: For the sake of channel cleanliness, `.l` and `.m` may be restricted to a specific `#bot-commands` channel by admins via the web dashboard.*

### 🎙️ Dungeon (Temp Voice) Management
| Syntax | Parameters | Application | Action |
|:---|:---|:---|:---|
| `/vc-rename` | `[name]` | Slash | **Rename your temp voice channel**.<br>Changes the display name of your instantiated room. |
| `/vc-limit` | `[limit]` | Slash | **Set member limit**.<br>Restricts the room to a specific number of members (0 for infinite). |
| `/vc-lock` | — | Slash | **Lock your temp voice channel**.<br>Removes `Connect` permissions for the default server role. |
| `/vc-unlock` | — | Slash | **Unlock your temp voice channel**.<br>Restores default `Connect` access to the room. |
| `/vc-invite` | `[member]` | Slash | **Send a styled invite to a hunter in DMs**.<br>Bypasses channel locks by directly providing a temporary access link. |

---

## 🛡️ Moderator & Admin Commands
Commands reserved for users with server management permissions. They bypass all strict channel locks.

| Syntax | Application | Permissions | Action |
|:---|:---|:---|:---|
| `/pomo-setup` | Slash | `Manage Channels` | **Initiate the Scribe Focus Engine**.<br>Spawns the Pomodoro HUD into the configured text channel for the Voice Channel you are currently inside. |
| `.sync-guild` | Prefix | `Administrator` | **Force sync commands**.<br>Manually forces Discord to re-cache slash commands to your specific local server immediately. |

---

## 👑 Owner-Only Hidden Commands
Commands hardcoded to the Discord User ID of the Bot Owner.

| Syntax | Application | Permissions | Action |
|:---|:---|:---|:---|
| `.sync` | Prefix | `Bot Owner` | **Sync slash commands globally**.<br>Pushes the latest command tree updates across all servers. Can take up to 60 minutes to propagate natively across Discord's CDN. |
