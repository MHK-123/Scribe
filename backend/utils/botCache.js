import Redis from 'ioredis';
import { config } from '../config.js';

let redis = null;
if (config.REDIS_URL) {
  redis = new Redis(config.REDIS_URL);
  redis.on('error', (err) => console.error('Redis Client Error:', err));
  redis.on('connect', () => console.log('✅ [Redis]: Connection manifested.'));
} else {
  console.warn('⚠️ [Redis]: REDIS_URL absent. Falling back to local in-memory storage (Inefficient for scale).');
}

/**
 * ─── Shared Bot Guild Cache ───────────────────────────────────────────────
 * Centralised vision store for the bot's known guild presence.
 * Using Redis for production-grade persistence and horizontal scaling.
 */

// Memory fallback for environments without Redis
const MEM_BOT_CACHE = { ids: [], lastFetch: 0 };
const BOT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const USER_GUILD_CACHE = new Map(); // Local fallback
const USER_GUILD_TTL = 120 * 1000;  // 120 seconds (2 minutes)

export const botCache = {
  // ── Bot Presence Cache ──────────────────────────────────────────────────
  getIds: async () => {
    if (redis) {
      const ids = await redis.get('bot:guild_ids');
      return ids ? JSON.parse(ids) : [];
    }
    return MEM_BOT_CACHE.ids;
  },

  setIds: async (ids) => {
    if (redis) {
      await redis.set('bot:guild_ids', JSON.stringify(ids), 'PX', BOT_CACHE_TTL);
      await redis.set('bot:last_fetch', Date.now());
    } else {
      MEM_BOT_CACHE.ids = ids;
      MEM_BOT_CACHE.lastFetch = Date.now();
    }
  },

  isExpired: async () => {
    if (redis) {
      const lastFetch = await redis.get('bot:last_fetch');
      return !lastFetch || (Date.now() - parseInt(lastFetch) > BOT_CACHE_TTL);
    }
    return Date.now() - MEM_BOT_CACHE.lastFetch > BOT_CACHE_TTL;
  },

  invalidate: async () => {
    if (redis) {
      await redis.del('bot:last_fetch');
    } else {
      MEM_BOT_CACHE.lastFetch = 0;
    }
  },

  isBotPresent: async (guildId) => {
    const ids = await botCache.getIds();
    return ids.includes(guildId);
  },

  // ── User's Personal Guild Cache ──────────────────────────────────────────
  /**
   * Get a user's cached guild list (30-120s TTL).
   */
  getUserGuilds: async (userId) => {
    if (redis) {
      const data = await redis.get(`user:guilds:${userId}`);
      return data ? JSON.parse(data) : null;
    }
    
    const entry = USER_GUILD_CACHE.get(userId);
    if (!entry || Date.now() > entry.expiresAt) {
      USER_GUILD_CACHE.delete(userId);
      return null;
    }
    return entry.guilds;
  },

  /**
   * Store user's guild list in the cache.
   */
  setUserGuilds: async (userId, guilds) => {
    if (redis) {
      await redis.set(`user:guilds:${userId}`, JSON.stringify(guilds), 'PX', USER_GUILD_TTL);
    } else {
      USER_GUILD_CACHE.set(userId, {
        guilds,
        expiresAt: Date.now() + USER_GUILD_TTL,
      });
    }
  },

  clearUserGuilds: async (userId) => {
    if (redis) {
      await redis.del(`user:guilds:${userId}`);
    } else {
      USER_GUILD_CACHE.delete(userId);
    }
  },
};
