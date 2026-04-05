import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';
import axios from 'axios';
import { config } from '../config.js';

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

// Simple in-memory cache for global guilds to prevent Discord rate-limiting
let globalGuildsCache = { data: null, lastFetch: 0 };
const CACHE_TTL = 30 * 1000; // 30 seconds for admin view

// GET /admin/guilds - List all guilds with live status + member counts (cached)
router.get('/guilds', async (req, res) => {
  try {
    // 1. Fetch metadata from DB (configs + feature flags)
    const dbGuilds = await query('SELECT * FROM guild_configs');
    const configsMap = {};
    dbGuilds.rows.forEach(row => {
      configsMap[row.guild_id] = row;
    });

    // 2. Fetch guilds from Discord (as before for basic list)
    if (globalGuildsCache.data && (Date.now() - globalGuildsCache.lastFetch < CACHE_TTL)) {
      const merged = globalGuildsCache.data.map(g => ({
        ...g,
        config: configsMap[g.id] || null
      }));
      return res.json(merged);
    }

    const botRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
    });
    
    // 3. Request extra info (member counts) from bot via socket (optional but better)
    // For now, we merge DB configs and basic Discord info
    const merged = botRes.data.map(g => ({
      ...g,
      config: configsMap[g.id] || null
    }));

    globalGuildsCache = { data: botRes.data, lastFetch: Date.now() };
    res.json(merged);
  } catch (err) {
    if (globalGuildsCache.data) {
       return res.json(globalGuildsCache.data);
    }
    res.status(500).json({ error: 'Scrying failed.' });
  }
});

// PATCH /admin/guilds/:id/features - Toggle feature flags
router.patch('/guilds/:id/features', async (req, res) => {
  const { id } = req.params;
  const { feature, value } = req.body; // e.g., { feature: 'is_vc_control_enabled', value: true }

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
    await axios.delete(`https://discord.com/api/users/@me/guilds/${req.params.id}`, {
      headers: { Authorization: `Bot ${config.DISCORD_TOKEN}` },
    });
    res.json({ success: true, message: 'Connection severed successfully.' });
  } catch (err) {
    console.error('Admin Guild Delete Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'The ritual failed: Could not sever global link.' });
  }
});

export default router;
