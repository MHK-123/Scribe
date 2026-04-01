# ⚔️ Scribe • Command Compendium

Welcome to the **Command Compendium**, a complete guide to interacting with the Scribe Engine to manage temporary voice channels, track study sessions, and configure your Discord server.

---

## 🎧 Temporary Voice Channel Commands (Slash Commands)
*These commands are exclusively available to the **owner** (creator) of a temporary voice channel while inside their assigned channel.*

| Command | Description | Usage |
|---------|-------------|-------|
| `/vc-rename [name]` | Renames your active dungeon (voice channel). | `/vc-rename name: Deep Work Focus` |
| `/vc-lock` | Locks the channel to prevent new members from joining. | `/vc-lock` |
| `/vc-unlock`| Unlocks the channel so other hunters can join freely. | `/vc-unlock` |
| `/vc-limit [limit]` | Sets maximum participant limit (0 to 99). | `/vc-limit limit: 4` |
| `/vc-invite [@user]`| Sends a stylized, one-time invite link directly to a user's DMs. | `/vc-invite member: @Hunter` |

---

## 🛡️ Admin & Moderation Nodes (Prefix Commands)
*These commands are dedicated to Server Administrators and the Bot Owner for propagation and synchronization of the network.*

| Command | Level | Description |
|---------|-------|-------------|
| `.sync` | Owner | Propagates all slash commands globally across all connected servers. *(May take up to an hour to apply everywhere).* |
| `.sync-guild` | Admin | Immediately forces a slash command sync exclusively for the current server. Use this if commands are missing. |

---

## 🎯 Hunter Tracking & Statistics (Prefix Commands)
*View player cards, level progression, and server-wide leaderboards based on accumulated VC study time.*

| Command | Description | Example Output |
|---------|-------------|----------------|
| `.m` | Displays your personal **Player Card** showing your current Level, Total Time (Hours), and Total XP. | `👤 PLAYER CARD: Hunter...` |
| `.l` | Displays the **Top Hunters** leaderboard for the current server, ranked by total study hours. | `⚔️ RANKING: TOP HUNTERS` |
| `.help` | Brings up the in-game Scribe System Help panel with an overview of features. | `SANCTUM SYSTEM INTERFACE` |

---

## ⌛ Scribe Engine • Auto Systems
The core functionality of Scribe is heavily automated. Many features run quietly in the background without needing manual commands.

1. **Auto Voice Channel Creation:**
   * Joining the configured "Join-to-Create" channel instantly spawns a personalized temporary room.
   * The room auto-archives (deletes) itself when the last member leaves.

2. **Pomodoro Engine (Scribe HUD):**
   * Pomodoro sessions are configured via the **Web Dashboard**, rather than slash commands.
   * Sessions auto-start when a member joins a configured voice channel.
   * A premium animated "Scribe System" HUD is posted and dynamically updated in the associated text channel.

3. **Temporal Calibration (Monthly Resets):**
   * Role assignment, XP calculation, and leaderboard resets happen automatically according to the configured server Timezone established via the Web Dashboard.
