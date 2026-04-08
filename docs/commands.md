# Scribe Commands

Welcome to the **Commands List**, a guide to interacting with Scribe to manage temporary voice channels, track study sessions, and configure your Discord server.

---

## Command Security
> [!IMPORTANT]
> **Channel Restriction**: Prefix commands (`.l`, `.m`, etc.) are limited to the **single channel** you configure in the Web Dashboard settings. 
> - If used elsewhere, the bot will automatically delete the message and notify the user via DM.
> - This restriction applies to everyone, including Administrators, to ensure zero clutter in general channels.

---

## Temporary Voice Channel Commands (Slash Commands)
*These commands are available to the **owner** (creator) of a temporary voice channel while inside their assigned channel.*

| Command | Description | Usage |
|---------|-------------|-------|
| `/vc-rename [name]` | Renames your active voice channel. | `/vc-rename name: Deep Work Focus` |
| `/vc-lock` | Locks the channel to prevent new members from joining. | `/vc-lock` |
| `/vc-unlock`| Unlocks the channel so others can join freely. | `/vc-unlock` |
| `/vc-limit [limit]` | Sets maximum participant limit (0 to 99). | `/vc-limit limit: 4` |
| `/vc-invite [@user]`| Sends a one-time invite link directly to a user's DMs. | `/vc-invite member: @User` |
| `/pomodoro-create [focus] [break]` | Starts a custom pomodoro timer in any voice channel. | `/pomodoro-create focus: 45 break: 10` |

---

## User Tracking & Statistics (Prefix Commands)
*View player cards, level progression, and server-wide leaderboards.*

| Command | Description | Example Output |
|---------|-------------|----------------|
| `.m` | Displays your personal **Player Card**. | `PLAYER CARD ... User: <@123...>` |
| `.l` | Displays the **Top Users** leaderboard. | `Rank 1 — <@123...> • Level 5 • 42.0h` |
| `.help` | Brings up the in-game Scribe Help panel. | `SYSTEM INTERFACE` |

---

## Admin Commands (Prefix Commands)
*Dedicated to Server Administrators for bot setup.*

| Command | Level | Description |
|---------|-------|-------------|
| `.sync` | Bot Owner | Propagates all slash commands globally. |
| `.sync-guild` | Admin | Instantly forces a slash command sync for the current server. |

---

## Automated Systems
The core functionality of Scribe is heavily automated:

1. **Auto Voice Channel Creation:**
   * Joining the "Join-to-Create" channel instantly spawns a personalized temporary room.
   * The room auto-deletes itself when the last member leaves.

2. **Pomodoro Timer:**
   * Configured via the **Web Dashboard**.
   * Supports **Continuous Mode** (0) for 24/7 focus rooms.
   * Accurate sync logic ensures cycles and durations never revert.

3. **Monthly Resets:**
   * Role assignment and leaderboard resets happen automatically according to your Dashboard Timezone.
