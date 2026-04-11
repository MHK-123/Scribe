import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeGuild } from '../middleware/guildAuth.js';
import { query } from '../db.js';
import { botCache } from '../utils/botCache.js';
import { discordService } from '../services/discordService.js';

const router = express.Router();
router.use(authenticate);

// INTERNAL: Triggered by Bot on Guild Join
router.post('/refresh-cache', async (req, res) => {
  const auth = req.headers['x-bot-token'];
  // (Assuming Bot Token remains in config.js for direct comparison)
  // But we still use discordService for the actual fetch
  try {
    const ids = await discordService.getBotGuilds();
    res.json({ success: true, count: ids.length });
  } catch (e) {
    res.status(500).json({ error: 'Proactive refresh failed.' });
  }
});

// GET /guilds — list servers the user manages that have the bot installed
router.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    console.log(`🔮 [SENTINEL]: Realm fetch initiated for user ${userId}`);
    
    // 1. Fetch User Guilds (Service handles Redis + 429s)
    const userGuilds = await discordService.getUserGuilds(userId, req.user.access_token);

    // 2. Refresh Bot Vision (Fail-Safe)
    let botIds = [];
    try {
      const botGuilds = await discordService.getBotGuilds();
      botIds = botGuilds.map(bg => bg.id);
    } catch (e) {
      console.warn('⚠️ [SENTINEL]: Bot vision failed to manifest. Proceeding with user-only view.');
    }

    // 3. Merge Logic: Only show servers where user has Manage Guild or Admin
    const result = userGuilds
      .filter(g => {
        const userPerms = BigInt(g.permissions);
        const MANAGE_GUILD = 0x20n;
        const ADMINISTRATOR = 0x8n;
        
        const hasManage = (userPerms & MANAGE_GUILD) === MANAGE_GUILD;
        const hasAdmin = (userPerms & ADMINISTRATOR) === ADMINISTRATOR;
        const isOwner = g.owner === true;
        
        return hasManage || hasAdmin || isOwner;
      })
      .map(g => ({
        ...g,
        is_installed: botIds.includes(g.id),
        icon_url: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      }));

    res.json(result);
  } catch (err) {
    console.error('🛡️ [SENTINEL]: User Realm fetch failed:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch sanctuaries.' });
  }
});

// GET /guilds/:id — fetch single guild info (name, icon)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const userGuilds = await discordService.getUserGuilds(userId, req.user.access_token);
    const guild = userGuilds.find(g => g.id === id);
    if (!guild) return res.status(404).json({ error: 'Guild not found in your managed list' });

    const isInstalled = await botCache.isBotPresent(id);

    res.json({
      id: guild.id,
      name: guild.name,
      icon_url: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
      is_installed: isInstalled
    });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch guild info' });
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
    const roles = await discordService.getGuildRoles(req.params.id);
    res.json(roles);
  } catch (err) {
    console.error('GET /guilds/:id/roles error:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch guild roles' });
  }
});

// GET /guilds/:id/channels — returns channels grouped by type
router.get('/:id/channels', authorizeGuild, async (req, res) => {
  try {
    const all = await discordService.getGuildChannels(req.params.id);
    res.json({
      voiceChannels: all.filter(c => c.type === 2).sort((a, b) => a.position - b.position),
      categories:    all.filter(c => c.type === 4).sort((a, b) => a.position - b.position),
      textChannels:  all.filter(c => c.type === 0).sort((a, b) => a.position - b.position),
    });
  } catch (err) {
    console.error('GET /guilds/:id/channels error:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch guild channels' });
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
/**
 * Helper to ensure user metadata is in the database.
 */
async function getLeaderboardMetadata(guildId, userIds) {
  if (userIds.length === 0) return {};
  
  // 1. Fetch existing from DB
  const dbUsers = await query(
    `SELECT * FROM users WHERE user_id = ANY($1)`,
    [userIds]
  );
  
  const metadataMap = {};
  dbUsers.rows.forEach(u => metadataMap[u.user_id] = u);
  
  // 2. Identify missing users or stale ones (older than 24h)
  const missing = userIds.filter(id => {
    const u = metadataMap[id];
    if (!u) return true;
    const cacheAge = (Date.now() - new Date(u.last_updated).getTime()) / 1000;
    return cacheAge > 86400; // 24h stale
  });

  if (missing.length > 0) {
    console.log(`📡 [Leaderboard]: Refreshing metadata for ${missing.length} users...`);
    for (const userId of missing) {
      const member = await discordService.getGuildMember(guildId, userId);
      if (member && member.user) {
        const username = member.user.username;
        const avatar = member.user.avatar 
          ? `https://cdn.discordapp.com/avatars/${userId}/${member.user.avatar}.png`
          : null;
        
        await query(
          `INSERT INTO users (user_id, username, avatar_url, last_updated)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id) DO UPDATE 
           SET username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url, last_updated = NOW()`,
          [userId, username, avatar]
        );
        metadataMap[userId] = { user_id: userId, username, avatar_url: avatar };
      }
    }
  }

  return metadataMap;
}

router.get('/:id/leaderboard', async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  try {
    let rows = [];
    if (type === 'monthly') {
      const result = await query(
        `SELECT user_id, rank, total_hours FROM monthly_leaderboards
         WHERE guild_id = $1 AND month = EXTRACT(MONTH FROM NOW()) AND year = EXTRACT(YEAR FROM NOW())
         ORDER BY rank ASC`,
        [id]
      );
      rows = result.rows;
    } else if (type === 'last_month') {
      const result = await query(
        `SELECT user_id, rank, total_hours FROM monthly_leaderboards
         WHERE guild_id = $1
           AND month = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
           AND year  = EXTRACT(YEAR  FROM CURRENT_DATE - INTERVAL '1 month')
         ORDER BY rank ASC`,
        [id]
      );
      rows = result.rows;
    } else {
      // Default: all-time
      const result = await query(
        `SELECT user_id, SUM(duration) AS total_duration
         FROM study_sessions WHERE guild_id = $1
         GROUP BY user_id ORDER BY total_duration DESC LIMIT 100`,
        [id]
      );
      rows = result.rows.map((row, i) => ({
        user_id:     row.user_id,
        total_hours: (row.total_duration / 3600).toFixed(2),
        rank:        i + 1,
      }));
    }

    const userIds = rows.map(r => r.user_id);
    const metadata = await getLeaderboardMetadata(id, userIds);

    const merged = rows.map(r => ({
      ...r,
      username:   metadata[r.user_id]?.username || `Hunter ${r.user_id.slice(-4)}`,
      avatar_url: metadata[r.user_id]?.avatar_url || null
    }));

    res.json(merged);
  } catch (err) {
    console.error('Leaderboard Fetch Error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /guilds/:id/weekly-hours — last 7 days for the activity chart
router.get('/:id/weekly-hours', async (req, res) => {
  try {
    const result = await query(
      `SELECT TO_CHAR(join_time, 'YYYY-MM-DD') AS day_str, COALESCE(SUM(duration), 0) AS total_seconds
       FROM study_sessions
       WHERE guild_id = $1 AND join_time >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY day_str ORDER BY day_str ASC`,
      [req.params.id]
    );

    const dayMap = new Map();
    result.rows.forEach(row => {
      dayMap.set(row.day_str, parseFloat((row.total_seconds / 3600).toFixed(2)));
    });

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      
      chartData.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: dayMap.get(key) || 0
      });
    }

    res.json(chartData);
  } catch (err) {
    console.error('Failed to fetch weekly data:', err);
    res.status(500).json({ error: 'Failed to fetch weekly data' });
  }
});

export default router;
