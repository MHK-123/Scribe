import { botCache } from '../utils/botCache.js';
import { discordService } from '../services/discordService.js';

/**
 * Middleware to authorize guild-level access based on Discord permissions.
 * Now powered by DiscordService (with 429 backoff & Redis caching).
 */
export const authorizeGuild = async (req, res, next) => {
  const guildId = req.params.guildId || req.params.id;
  const userId  = req.user?.id;

  if (!guildId) {
    return res.status(400).json({ error: 'Guild ID is required for authorization.' });
  }

  // 1. Manage Force Refresh
  if (req.query.force === 'true') {
    await botCache.clearUserGuilds(userId);
    console.log(`🔄 [GuildAuth]: Force refresh requested for ${userId}. Clearing cache.`);
  }

  try {
    // 2. Fetch User Guilds via DiscordService (Handles Caching + 429s)
    const userGuilds = await discordService.getUserGuilds(userId, req.user.access_token);
    
    // 3. Member Proof
    const targetGuild = userGuilds.find(g => g.id === guildId);

    if (!targetGuild) {
      // Bot presence check (async)
      const botIds = await botCache.getIds();
      if (botIds.length > 0 && !(await botCache.isBotPresent(guildId))) {
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

    // 4. Permission Ritual (MANAGE_GUILD)
    const MANAGE_GUILD = 0x20n;
    const userPerms = BigInt(targetGuild.permissions);

    if ((userPerms & MANAGE_GUILD) !== MANAGE_GUILD) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient Authority.',
        details: 'You lack the MANAGE_GUILD permission required to calibrate this realm.',
      });
    }

    next();
  } catch (err) {
    const status = err.response?.status;
    const discordMsg = err.response?.data?.message;

    console.error(`🛡️ [GuildAuth]: Authorization ritual failed for user ${userId} (Guild ${guildId}):`, {
      status,
      discordMsg,
      msg: err.message,
    });

    if (status === 429) {
      const retryAfter = err.response?.headers?.['retry-after'] || '60';
      return res.status(429).json({
        error: 'High Flux Pattern Detected (Rate Limited).',
        details: `The portal to Discord is temporarily locked. Try again in ${retryAfter}s.`,
      });
    }

    if (status === 401) {
      return res.status(401).json({
        error: 'Hunter session expired. Please log out and log back in.',
      });
    }

    res.status(500).json({
      error: 'Authorization ritual encountered an anomaly.',
      details: err.message,
    });
  }
};
