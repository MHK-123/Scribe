import axios from 'axios';
import { botCache } from '../utils/botCache.js';
import { config } from '../config.js';

// ─── Request Collasing Map ──────────────────────────────────────────────────
// Stores active promises for the same resource to prevent "Thundering Herd"
const activeRequests = new Map();

const discordClient = axios.create({
  baseURL: 'https://discord.com/api',
  timeout: 10000,
});

// ─── 429 Interceptor & Backoff ──────────────────────────────────────────────
discordClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config: originalRequest, response } = error;

    if (response && response.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      const retryAfter = (response.headers['retry-after'] || 5) * 1000;
      
      console.warn(`⏳ [DiscordService]: Rate limit hit. Backing off for ${retryAfter}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      
      return discordClient(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

export const discordService = {
  /**
   * Fetch user's guilds with caching and request collapsing.
   */
  getUserGuilds: async (userId, accessToken) => {
    const cacheKey = `user_guilds_${userId}`;
    
    // 1. Check Redis Cache
    const cached = await botCache.getUserGuilds(userId);
    if (cached) return cached;

    // 2. Request Collapsing: If already fetching, wait for that promise
    if (activeRequests.has(cacheKey)) {
      return activeRequests.get(cacheKey);
    }

    const requestPromise = (async () => {
      try {
        console.log(`📡 [DiscordService]: Fetching guilds for user ${userId}...`);
        const { data } = await discordClient.get('/users/@me/guilds', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        await botCache.setUserGuilds(userId, data);
        return data;
      } finally {
        activeRequests.delete(cacheKey);
      }
    })();

    activeRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  /**
   * Fetch guilds the bot is in (Bot Token).
   */
  getBotGuilds: async () => {
    const cacheKey = 'bot_guilds';
    
    // 1. Check Redis via botCache
    if (!(await botCache.isExpired())) {
      return await botCache.getIds();
    }

    if (activeRequests.has(cacheKey)) return activeRequests.get(cacheKey);

    const requestPromise = (async () => {
      try {
        console.log('📡 [DiscordService]: Refreshing bot vision (@me/guilds)...');
        const { data } = await discordClient.get('/users/@me/guilds', {
          headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
        });
        const ids = data.map(g => g.id);
        await botCache.setIds(ids);
        return ids;
      } finally {
        activeRequests.delete(cacheKey);
      }
    })();

    activeRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  /**
   * Fetch guild roles (Bot Token) with 60s cache.
   */
  getGuildRoles: async (guildId) => {
    const cacheKey = `roles:${guildId}`;
    const cached = await botCache.getUserGuilds(cacheKey); // Reusing user cache logic for simplicity
    if (cached) return cached;

    if (activeRequests.has(cacheKey)) return activeRequests.get(cacheKey);

    const requestPromise = (async () => {
      try {
        const { data } = await discordClient.get(`/guilds/${guildId}/roles`, {
          headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
        });
        await botCache.setUserGuilds(cacheKey, data); // Cache for 120s
        return data;
      } finally {
        activeRequests.delete(cacheKey);
      }
    })();

    activeRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  /**
   * Fetch guild channels (Bot Token).
   */
  getGuildChannels: async (guildId) => {
    const cacheKey = `channels:${guildId}`;
    const cached = await botCache.getUserGuilds(cacheKey);
    if (cached) return cached;

    if (activeRequests.has(cacheKey)) return activeRequests.get(cacheKey);

    const requestPromise = (async () => {
      try {
        const { data } = await discordClient.get(`/guilds/${guildId}/channels`, {
          headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
        });
        await botCache.setUserGuilds(cacheKey, data); // Cache for 120s
        return data;
      } finally {
        activeRequests.delete(cacheKey);
      }
    })();

    activeRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  /**
   * Sever connection to a guild (Bot Token).
   */
  leaveGuild: async (guildId) => {
    console.log(`🧨 [DiscordService]: Severing connection to guild ${guildId}...`);
    const res = await discordClient.delete(`/users/@me/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
    });
    // Invalidate bot cache so the next fetch is fresh
    await botCache.invalidate();
    return res.data;
  },

  /**
   * Exchange OAuth2 code for an access token.
   */
  exchangeCodeForToken: async (code) => {
    const params = new URLSearchParams({
      client_id: config.DISCORD_CLIENT_ID,
      client_secret: config.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code.trim(),
      redirect_uri: config.DISCORD_OAUTH_REDIRECT_URI
    });

    console.log('📡 [DiscordService]: Initiating OAuth2 token exchange...');
    try {
      const { data } = await discordClient.post('/oauth2/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return data;
    } catch (err) {
      console.error('❌ [DiscordService]: Token exchange failed!');
      console.error('Detailed Error Response:', err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Fetch base user info (identify scope).
   */
  getUserInfo: async (accessToken) => {
    console.log('📡 [DiscordService]: Fetching @me user identity...');
    const { data } = await discordClient.get('/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return data;
  }
};
