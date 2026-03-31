import express from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';
import { query } from '../db.js';
import { config } from '../config.js';

const router = express.Router();
router.use(authenticate);

// Simple in-memory cache for bot guilds to prevent Discord rate-limiting
let botGuildsCache = { ids: [], lastFetch: 0 };
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// GET /guilds — list servers the user manages that have the bot installed
router.get('/', async (req, res) => {
  try {
    const authRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${req.user.discord_access_token}` },
    });

    const MANAGE_GUILD = 0x20;
    const managed = authRes.data.filter(g => (g.permissions & MANAGE_GUILD) === MANAGE_GUILD);

    // Refresh bot guild cache when stale
    if (Date.now() - botGuildsCache.lastFetch > CACHE_TTL) {
      try {
        const botRes = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
        });
        botGuildsCache = { ids: botRes.data.map(g => g.id), lastFetch: Date.now() };
      } catch (e) {
        console.error('Failed to refresh bot guild cache:', e.response?.data || e.message);
      }
    }

    const result = managed.map(g => ({
      ...g,
      is_installed: botGuildsCache.ids.includes(g.id),
      icon_url: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /guilds error:', err.message);
    res.status(500).json({ error: 'Failed to fetch guilds' });
  }
});

// GET /guilds/:id/config
router.get('/:id/config', async (req, res) => {
  try {
    const result = await query('SELECT * FROM guild_configs WHERE guild_id = $1', [req.params.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// POST /guilds/:id/config — upsert guild configuration
router.post('/:id/config', async (req, res) => {
  const { id } = req.params;
  const {
    join_to_create_channel, temp_vc_category, default_user_limit, auto_delete_empty,
    vc_name_template, top1_role_id, top2_role_id, top3_role_id, top10_role_id, announcement_channel_id,
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO guild_configs
        (guild_id, join_to_create_channel, temp_vc_category, default_user_limit,
         auto_delete_empty, vc_name_template, top1_role_id, top2_role_id, top3_role_id,
         top10_role_id, announcement_channel_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (guild_id) DO UPDATE SET
         join_to_create_channel = $2, temp_vc_category = $3, default_user_limit = $4,
         auto_delete_empty = $5, vc_name_template = $6, top1_role_id = $7,
         top2_role_id = $8, top3_role_id = $9, top10_role_id = $10, announcement_channel_id = $11
       RETURNING *`,
      [id, join_to_create_channel, temp_vc_category, default_user_limit ?? 0,
       auto_delete_empty !== false, vc_name_template || "{username}'s Dungeon",
       top1_role_id, top2_role_id, top3_role_id, top10_role_id, announcement_channel_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /guilds/:id/config error:', err.message);
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// GET /guilds/:id/voice-channels
router.get('/:id/voice-channels', async (req, res) => {
  try {
    const result = await query('SELECT * FROM temp_voice_channels WHERE guild_id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch voice channels' });
  }
});

// GET /guilds/:id/roles — fetched via bot token from Discord
router.get('/:id/roles', async (req, res) => {
  try {
    const rolesRes = await axios.get(`https://discord.com/api/guilds/${req.params.id}/roles`, {
      headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
    });
    res.json(rolesRes.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch guild roles' });
  }
});

// GET /guilds/:id/channels — returns channels grouped by type
router.get('/:id/channels', async (req, res) => {
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
