import express from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';
import { authorizeGuild } from '../middleware/guildAuth.js';
import { query } from '../db.js';
import { config } from '../config.js';
import { botCache } from '../utils/botCache.js';

const router = express.Router();
router.use(authenticate);


// INTERNAL: Triggered by Bot on Guild Join
router.post('/refresh-cache', async (req, res) => {
  const auth = req.headers['x-bot-token'];
  if (!auth || auth !== config.DISCORD_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized Bot Sync' });
  }
  
  try {
    // 🛡️ [PROACTIVE]: Don't just clear, manifest the new IDs immediately
    const botRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
    });
    
    if (botRes.data && Array.isArray(botRes.data)) {
      botCache.setIds(botRes.data.map(g => g.id));
      console.log(`⚡ [Cache]: Bot vision REFRESHED proactively (${botRes.data.length} realms).`);
    }
  } catch (e) {
    botCache.invalidate(); // Fallback: force re-fetch on next request
    console.warn('⚠️ [Cache]: Proactive refresh failed, falling back to 0-stamp.');
  }

  res.json({ success: true });
});

// GET /guilds — list servers the user manages that have the bot installed
router.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    console.log(`🔮 [SENTINEL]: Realm fetch initiated for user ${userId}`);
    
    // 1. Try to use cached user guild list (Prevents 429s on 'Choose Realm' page)
    let userGuilds = botCache.getUserGuilds(userId);

    if (!userGuilds) {
      const authRes = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${req.user.discord_access_token}` },
      });
      userGuilds = authRes.data;
      botCache.setUserGuilds(userId, userGuilds);
      console.log(`✅ [SENTINEL]: User guild list fetched and cached for ${userId} (Dashboard List).`);
    } else {
      console.log(`⚡ [SENTINEL]: User guild list served from cache for ${userId} (Dashboard List).`);
    }

    const MANAGE_GUILD = 0x20n; // BigInt for bitwise accuracy
    
    // 3. Manifest Bot Guild Cache (Fail-Safe Shield)
    if (req.query.force === 'true' || botCache.isExpired()) {
      try {
        const botRes = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
        });
        
        // SEAL: Only update if the vision is absolute
        if (botRes.data && Array.isArray(botRes.data)) {
          botCache.setIds(botRes.data.map(g => g.id));
          console.log(`💾 [SENTINEL]: Bot Cache REFILLED. Presence in ${botRes.data.length} realms.`);
        }
      } catch (e) {
        console.error('⚠️ [SENTINEL]: Bot vision blurred. Retention mode active.', e.response?.status === 429 ? 'DISCORD IP CURSE (429)' : e.message);
        // We DO NOT wipe the cache here. We keep the old ids.
        if (botCache.getIds().length === 0) {
          console.warn('❌ [SENTINEL]: Bot vision is EMPTY. No sanctuaries discovered.');
        }
      }
    }

    const result = userGuilds
      .filter(g => {
        const userPerms = BigInt(g.permissions);
        const isManaged = (userPerms & MANAGE_GUILD) === MANAGE_GUILD;
        
        // SEAL: Only show realms where the hunter has administrative authority
        return isManaged;
      })
      .map(g => ({
        ...g,
        is_installed: botCache.isBotPresent(g.id),
        icon_url: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      }));

    console.log(`✨ [SENTINEL]: Manifesting ${result.length} realms for the hunter.`);
    res.json(result);
  } catch (err) {
    const status = err.response?.status;
    const discordMsg = err.response?.data?.message;
    console.error('🛡️ [SENTINEL]: User Realm fetch failed:', { status, discordMsg, msg: err.message });

    if (status === 429) {
      const retryAfter = err.response?.headers?.['retry-after'] || '60';
      return res.status(429).json({ 
        error: `High Flux Detected. Discord portal is temporarily locked (Rate Limit).`,
        details: `Try again after ${retryAfter} seconds.`,
        retryAfter: parseInt(retryAfter)
      });
    }

    if (status === 401) {
      return res.status(401).json({ error: 'Hunter session expired. Please log out and back in.' });
    }

    res.status(500).json({ error: 'Failed to fetch sanctuaries from the Discord dimension.' });
  }
});

// GET /guilds/:id — fetch single guild info (name, icon)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    // 1. Try to use cached user guild list (Prevents parallel 429s during dashboard navigation)
    let userGuilds = botCache.getUserGuilds(userId);

    if (!userGuilds) {
      const authRes = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${req.user.discord_access_token}` },
      });
      userGuilds = authRes.data;
      botCache.setUserGuilds(userId, userGuilds);
      console.log(`✅ [SENTINEL]: User guild list fetched and cached for ${userId} (Guild Info Request).`);
    } else {
      console.log(`⚡ [SENTINEL]: User guild list served from cache for ${userId} (Guild Info Request).`);
    }

    const guild = userGuilds.find(g => g.id === id);
    if (!guild) return res.status(404).json({ error: 'Guild not found in your managed list' });

    const MANAGE_GUILD = 0x20n;
    const userPerms = BigInt(guild.permissions);
    const isManaged = (userPerms & MANAGE_GUILD) === MANAGE_GUILD;
    const isInstalled = botCache.isBotPresent(id);

    if (!isManaged && !isInstalled) {
      return res.status(403).json({ error: 'Missing Manage Server permission' });
    }

    res.json({
      id: guild.id,
      name: guild.name,
      icon_url: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
    });
  } catch (err) {
    console.error(`GET /guilds/${id} error:`, err.message);
    if (err.response?.status === 429) {
      const retryAfter = err.response?.headers?.['retry-after'] || '60';
      return res.status(429).json({ 
        error: `High Flux Detected. Discord portal is temporarily locked.`,
        details: `Try again after ${retryAfter} seconds.`
      });
    }
    res.status(500).json({ error: 'Failed to fetch guild info' });
  }
});

// GET /guilds/:id/config
router.get('/:id/config', authorizeGuild, async (req, res) => {
  try {
    const result = await query('SELECT * FROM guild_configs WHERE guild_id = $1', [req.params.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// POST /guilds/:id/config — upsert guild configuration
router.post('/:id/config', authorizeGuild, async (req, res) => {
  const { id } = req.params;
  const {
    join_to_create_channel, temp_vc_category, default_user_limit, auto_delete_empty,
    vc_name_template, top1_role_id, top2_role_id, top3_role_id, top10_role_id, announcement_channel_id,
    bot_command_channel_id,
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO guild_configs
        (guild_id, join_to_create_channel, temp_vc_category, default_user_limit,
         auto_delete_empty, vc_name_template, top1_role_id, top2_role_id, top3_role_id,
         top10_role_id, announcement_channel_id, bot_command_channel_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (guild_id) DO UPDATE SET
         join_to_create_channel   = COALESCE($2, guild_configs.join_to_create_channel),
         temp_vc_category         = COALESCE($3, guild_configs.temp_vc_category),
         default_user_limit       = COALESCE($4, guild_configs.default_user_limit),
         auto_delete_empty        = COALESCE($5, guild_configs.auto_delete_empty),
         vc_name_template         = COALESCE($6, guild_configs.vc_name_template),
         top1_role_id             = COALESCE($7, guild_configs.top1_role_id),
         top2_role_id             = COALESCE($8, guild_configs.top2_role_id),
         top3_role_id             = COALESCE($9, guild_configs.top3_role_id),
         top10_role_id            = COALESCE($10, guild_configs.top10_role_id),
         announcement_channel_id  = COALESCE($11, guild_configs.announcement_channel_id),
         bot_command_channel_id   = COALESCE($12, guild_configs.bot_command_channel_id)
       RETURNING *`,
      [id, join_to_create_channel, temp_vc_category, default_user_limit,
       auto_delete_empty, vc_name_template, top1_role_id, top2_role_id, top3_role_id,
       top10_role_id, announcement_channel_id, bot_command_channel_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /guilds/:id/config error:', err.message);
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// GET /guilds/:id/voice-channels
router.get('/:id/voice-channels', authorizeGuild, async (req, res) => {
  try {
    const result = await query('SELECT * FROM temp_voice_channels WHERE guild_id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch voice channels' });
  }
});

// GET /guilds/:id/roles — fetched via bot token from Discord
router.get('/:id/roles', authorizeGuild, async (req, res) => {
  try {
    const rolesRes = await axios.get(`https://discord.com/api/guilds/${req.params.id}/roles`, {
      headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
    });
    res.json(rolesRes.data);
  } catch (err) {
    console.error('GET /guilds/:id/roles error:', err.response?.data || err.message);
    if (err.response?.status === 404 || err.response?.status === 403) {
      return res.status(404).json({ error: 'Bot presence absent in this sanctuary.' });
    }
    res.status(500).json({ error: 'Failed to fetch guild roles' });
  }
});

// GET /guilds/:id/channels — returns channels grouped by type
router.get('/:id/channels', authorizeGuild, async (req, res) => {
  try {
    const channelsRes = await axios.get(`https://discord.com/api/guilds/${req.params.id}/channels`, {
      headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
    });
    const all = channelsRes.data;
    res.json({
      voiceChannels: all.filter(c => c.type === 2).sort((a, b) => a.position - b.position),
      categories:    all.filter(c => c.type === 4).sort((a, b) => a.position - b.position),
      textChannels:  all.filter(c => c.type === 0).sort((a, b) => a.position - b.position),
    });
  } catch (err) {
    console.error('GET /guilds/:id/channels error:', err.response?.data || err.message);
    if (err.response?.status === 404 || err.response?.status === 403) {
      return res.status(404).json({ error: 'Bot presence absent in this sanctuary.' });
    }
    res.status(500).json({ error: 'Failed to fetch guild channels' });
  }
});

// GET /guilds/:id/user-progress
router.get('/:id/user-progress', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM user_levels WHERE guild_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json(result.rows[0] || { level: 0, total_xp: 0, total_study_hours: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

// GET /guilds/:id/stats
router.get('/:id/stats', async (req, res) => {
  const { id } = req.params;
  try {
    const [channelsRes, hoursRes] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM temp_voice_channels WHERE guild_id = $1', [id]),
      query(
        `SELECT COALESCE(SUM(duration), 0) AS total
         FROM study_sessions
         WHERE guild_id = $1 AND DATE(join_time) = CURRENT_DATE`,
        [id]
      ),
    ]);
    res.json({
      activeVoiceChannels: parseInt(channelsRes.rows[0].count),
      totalHoursToday:     (parseInt(hoursRes.rows[0].total) / 3600).toFixed(2),
      usersStudying:       0, // requires real-time bot data via socket
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /guilds/:id/leaderboard?type=all_time|monthly|last_month
router.get('/:id/leaderboard', async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  try {
    if (type === 'monthly') {
      const result = await query(
        `SELECT user_id, rank, total_hours FROM monthly_leaderboards
         WHERE guild_id = $1 AND month = EXTRACT(MONTH FROM NOW()) AND year = EXTRACT(YEAR FROM NOW())
         ORDER BY rank ASC`,
        [id]
      );
      return res.json(result.rows);
    }

    if (type === 'last_month') {
      const result = await query(
        `SELECT user_id, rank, total_hours FROM monthly_leaderboards
         WHERE guild_id = $1
           AND month = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
           AND year  = EXTRACT(YEAR  FROM CURRENT_DATE - INTERVAL '1 month')
         ORDER BY rank ASC`,
        [id]
      );
      return res.json(result.rows);
    }

    // Default: all-time
    const result = await query(
      `SELECT user_id, SUM(duration) AS total_duration
       FROM study_sessions WHERE guild_id = $1
       GROUP BY user_id ORDER BY total_duration DESC LIMIT 100`,
      [id]
    );
    res.json(result.rows.map((row, i) => ({
      user_id:     row.user_id,
      total_hours: (row.total_duration / 3600).toFixed(2),
      rank:        i + 1,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /guilds/:id/weekly-hours — last 7 days for the activity chart
router.get('/:id/weekly-hours', async (req, res) => {
  try {
    const result = await query(
      `SELECT DATE(join_time) AS day, COALESCE(SUM(duration), 0) AS total_seconds
       FROM study_sessions
       WHERE guild_id = $1 AND join_time >= NOW() - INTERVAL '7 days'
       GROUP BY day ORDER BY day ASC`,
      [req.params.id]
    );
    res.json(result.rows.map(row => ({
      name:  new Date(row.day).toLocaleDateString('en-US', { weekday: 'short' }),
      hours: parseFloat((row.total_seconds / 3600).toFixed(2)),
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weekly data' });
  }
});

export default router;
