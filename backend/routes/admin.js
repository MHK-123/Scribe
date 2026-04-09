import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';
import axios from 'axios';
import { config } from '../config.js';

import { discordService } from '../services/discordService.js';
import { botCache } from '../utils/botCache.js';

const router = express.Router();
router.use(authenticate, verifyAdmin);

// GET /admin/stats - Global metrics
router.get('/stats', async (req, res) => {
  try {
    const [guilds, users, sessions] = await Promise.all([
      query('SELECT COUNT(*) AS total FROM guild_configs'),
      query('SELECT COUNT(DISTINCT user_id) AS total FROM user_levels'),
      query('SELECT SUM(duration) AS total FROM study_sessions')
    ]);

    res.json({
      totalGuilds: parseInt(guilds.rows[0].total || 0),
      totalUsers:  parseInt(users.rows[0].total || 0),
      totalHours:  (parseInt(sessions.rows[0].total || 0) / 3600).toFixed(1)
    });
  } catch (err) {
    console.error('Admin Stats Error:', err);
    res.status(500).json({ error: 'Ancient archives are currently unreadable.' });
  }
});

// GET /admin/guilds - List all guilds with live status + member counts (cached)
router.get('/guilds', async (req, res) => {
  try {
    const dbGuilds = await query('SELECT * FROM guild_configs');
    const configsMap = {};
    dbGuilds.rows.forEach(row => {
      configsMap[row.guild_id] = row;
    });

    // Fail-safe: bot vision may fail if token is missing
    let botGuilds = [];
    try {
      botGuilds = await discordService.getBotGuilds();
    } catch (e) {
      console.warn('⚠️ [ADMIN]: Bot vision unavailable. Serving DB-only manifest.');
    }

    // If bot has guilds, use them. Otherwise fall back to DB configs.
    if (botGuilds.length > 0) {
      const merged = botGuilds.map(guild => ({
        id: guild.id,
        name: guild.name || 'Unknown Realm',
        icon: guild.icon,
        memberCount: guild.memberCount || 0,
        config: configsMap[guild.id] || null
      }));
      return res.json(merged);
    }

    // Fallback: return DB-configured guilds with basic info
    const fallback = dbGuilds.rows.map(row => ({
      id: row.guild_id,
      name: `Guild ${row.guild_id}`,
      icon: null,
      memberCount: 0,
      config: row
    }));
    res.json(fallback);
  } catch (err) {
    console.error('Admin Scrying Failed:', err.message);
    res.status(500).json({ error: 'Scrying failed.' });
  }
});

// PATCH /admin/guilds/:id/features - Toggle feature flags
router.patch('/guilds/:id/features', async (req, res) => {
  const { id } = req.params;
  const { feature, value } = req.body; 

  const allowedFeatures = ['is_vc_control_enabled', 'is_pomodoro_enabled', 'is_leveling_enabled'];
  if (!allowedFeatures.includes(feature)) {
    return res.status(400).json({ error: 'Unknown mana node.' });
  }

  try {
    await query(
      `UPDATE guild_configs SET ${feature} = $1 WHERE guild_id = $2`,
      [value, id]
    );
    res.json({ success: true, message: 'Mana flow adjusted.' });
  } catch (err) {
    res.status(500).json({ error: 'The ritual failed.' });
  }
});

// DELETE /admin/guilds/:id - Sever connection to a guild
router.delete('/guilds/:id', async (req, res) => {
  try {
    await discordService.leaveGuild(req.params.id);
    res.json({ success: true, message: 'Connection severed successfully.' });
  } catch (err) {
    console.error('Admin Guild Delete Error:', err.message);
    res.status(500).json({ error: 'The ritual failed: Could not sever global link.' });
  }
});

export default router;
