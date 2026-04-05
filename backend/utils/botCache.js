/**
 * ─── Shared Bot Guild Cache ───────────────────────────────────────────────
 * Centralised vision store for the bot's known guild presence.
 * Used by guilds.js to track which servers the bot is in.
 * guildAuth.js reads from here but NEVER refreshes — only guilds.js refreshes.
 */

let _botCache = { ids: [], lastFetch: 0 };
const BOT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ── Per-user guild list cache ───────────────────────────────────────────────
// Prevents parallel requests from the same user triggering multiple Discord calls.
// Key: userId, Value: { guilds: [], expiresAt: timestamp }
const USER_GUILD_CACHE = new Map();
const USER_GUILD_TTL = 60 * 1000; // 60 seconds

export const botCache = {
  // ── Bot cache ─────────────────────────────────────────────────────────────
  getIds: () => _botCache.ids,
  getLastFetch: () => _botCache.lastFetch,
  isExpired: () => Date.now() - _botCache.lastFetch > BOT_CACHE_TTL,

  setIds: (ids) => {
    _botCache = { ids, lastFetch: Date.now() };
  },

  invalidate: () => {
    _botCache.lastFetch = 0; // Force re-fetch on next request
  },

  /** Returns true if the bot is present in the given guild */
  isBotPresent: (guildId) => {
    return _botCache.ids.includes(guildId);
  },

  // ── User guild cache ──────────────────────────────────────────────────────
  /**
   * Get a user's cached guild list. Returns null if cache is missing/expired.
   */
  getUserGuilds: (userId) => {
    const entry = USER_GUILD_CACHE.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      USER_GUILD_CACHE.delete(userId);
      return null;
    }
    return entry.guilds;
  },

  /**
   * Store a user's guild list in the short-lived cache.
   */
  setUserGuilds: (userId, guilds) => {
    USER_GUILD_CACHE.set(userId, {
      guilds,
      expiresAt: Date.now() + USER_GUILD_TTL,
    });
  },

  /**
   * Clear cached guild list for a user (e.g. on explicit re-scry).
   */
  clearUserGuilds: (userId) => {
    USER_GUILD_CACHE.delete(userId);
  },
};
