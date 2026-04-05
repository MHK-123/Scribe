import axios from 'axios';
import { botCache } from '../utils/botCache.js';

/**
 * Middleware to authorize guild-level access based on Discord permissions.
 *
 * KEY DESIGN RULES:
 *  1. This middleware NEVER refreshes the bot cache — only guilds.js does that.
 *  2. User guild lists are cached per-user for 60s to prevent parallel
 *     requests (e.g. config + channels loading simultaneously) from each
 *     independently calling Discord and triggering a real 429 rate limit.
 *  3. Error responses are specific — not generic fallbacks.
 *
 * Error types returned:
 *  - 400: Missing guild ID
 *  - 401: User session expired (Discord returned 401)
 *  - 403: User is not in guild / lacks permissions
 *  - 404: Bot is not present in the guild
 *  - 429: Real Discord rate limit (only set when Discord actually returns 429)
 *  - 503: Network timeout or Discord gateway down
 *  - 500: Unexpected error
 */
export const authorizeGuild = async (req, res, next) => {
  const guildId = req.params.id || req.params.guildId;
  const userId  = req.user?.id;

  if (!guildId) {
    return res.status(400).json({ error: 'Guild ID is required for authorization.' });
  }

  // ── Step 1: Try to use cached user guild list (prevents parallel 429s) ────
  if (req.query.force === 'true') {
    botCache.clearUserGuilds(userId);
    console.log(`🔄 [GuildAuth]: Force refresh requested for ${userId}. Clearing user guild cache.`);
  }

  let userGuilds = botCache.getUserGuilds(userId);

  if (!userGuilds) {
    // Cache miss — fetch from Discord and store result
    try {
      const { data } = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${req.user.discord_access_token}` },
        timeout: 8000,
      });
      userGuilds = data;
      botCache.setUserGuilds(userId, userGuilds);
      console.log(`✅ [GuildAuth]: User guild list fetched and cached for ${userId} (${userGuilds.length} guilds).`);
    } catch (err) {
      const status = err.response?.status;
      const discordMsg = err.response?.data?.message;

      console.error(`🛡️ [GuildAuth]: Discord user-guild fetch failed for guild ${guildId}:`, {
        status,
        discordMsg,
        code: err.code,
        msg: err.message,
      });

      if (status === 401) {
        return res.status(401).json({
          error: 'Hunter session expired. Please log out and log back in.',
          details: 'Your Discord access token has expired or been revoked.',
        });
      }

      if (status === 403) {
        return res.status(403).json({
          error: 'Discord denied access to your guild list.',
          details: discordMsg || 'Missing OAuth scopes or access was revoked.',
        });
      }

      if (status === 429) {
        const retryAfter = err.response?.headers?.['retry-after'] || 'a few seconds';
        console.warn(`⏳ [GuildAuth]: Discord rate limited. Retry-After: ${retryAfter}s`);
        return res.status(429).json({
          error: `Discord rate limit hit. Please wait ${retryAfter}s and try again.`,
          details: 'Too many requests to Discord in a short window. This is temporary.',
        });
      }

      // Timeout / no response
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || !err.response) {
        return res.status(503).json({
          error: 'Gateway Latency: The portal to Discord is temporarily unstable.',
          details: 'This is a transient network issue. Please try again shortly.',
        });
      }

      return res.status(500).json({
        error: 'Authorization ritual encountered an unexpected anomaly.',
        details: err.message,
      });
    }
  } else {
    console.log(`⚡ [GuildAuth]: User guild list served from cache for ${userId}.`);
  }

  // ── Step 2: Check user is a member of the target guild ────────────────────
  const targetGuild = userGuilds.find(g => g.id === guildId);

  if (!targetGuild) {
    // If the bot cache has data and the bot isn't in this guild, it's a bot-absence issue
    const botIds = botCache.getIds();
    if (botIds.length > 0 && !botCache.isBotPresent(guildId)) {
      return res.status(404).json({
        error: 'Bot presence absent in this sanctuary.',
        details: 'The Scribe has not been summoned to this realm. Invite the bot first.',
      });
    }
    return res.status(403).json({
      error: 'Forbidden: You are not a member of this realm.',
      details: 'Your hunter token does not grant access to the requested guild.',
    });
  }

  // ── Step 3: Verify MANAGE_GUILD permission ────────────────────────────────
  const MANAGE_GUILD = 0x20n;
  const userPerms = BigInt(targetGuild.permissions);

  if ((userPerms & MANAGE_GUILD) !== MANAGE_GUILD) {
    return res.status(403).json({
      error: 'Forbidden: Insufficient Authority.',
      details: 'You lack the MANAGE_GUILD permission required to calibrate this realm.',
    });
  }

  // ── Step 4: Authorized ────────────────────────────────────────────────────
  next();
};
