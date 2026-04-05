import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeGuild } from '../middleware/guildAuth.js';
import { query } from '../db.js';

const router = express.Router();
router.use(authenticate);

// GET /settings/export/:id — download guild config as JSON
router.get('/export/:id', authorizeGuild, async (req, res) => {
  try {
    const result = await query('SELECT * FROM guild_configs WHERE guild_id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Config not found' });
    res.setHeader('Content-Disposition', `attachment; filename=guild_${req.params.id}_config.json`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows[0], null, 2));
  } catch (err) {
    res.status(500).json({ error: 'Failed to export settings' });
  }
});

// POST /settings/import/:id — restore guild config from JSON
router.post('/import/:id', authorizeGuild, async (req, res) => {
  const { id } = req.params;
  const c = req.body;
  try {
    const result = await query(
      `INSERT INTO guild_configs
        (guild_id, join_to_create_channel, temp_vc_category, default_user_limit,
         auto_delete_empty, vc_name_template, top1_role_id, top2_role_id, top3_role_id, top10_role_id, reset_timezone, bot_command_channel_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (guild_id) DO UPDATE SET
         join_to_create_channel = EXCLUDED.join_to_create_channel,
         temp_vc_category       = EXCLUDED.temp_vc_category,
         default_user_limit     = EXCLUDED.default_user_limit,
         auto_delete_empty      = EXCLUDED.auto_delete_empty,
         vc_name_template       = EXCLUDED.vc_name_template,
         top1_role_id           = EXCLUDED.top1_role_id,
         top2_role_id           = EXCLUDED.top2_role_id,
         top3_role_id           = EXCLUDED.top3_role_id,
         top10_role_id          = EXCLUDED.top10_role_id,
         reset_timezone         = EXCLUDED.reset_timezone,
         bot_command_channel_id = EXCLUDED.bot_command_channel_id
       RETURNING *`,
      [id, c.join_to_create_channel, c.temp_vc_category, c.default_user_limit ?? 0,
       c.auto_delete_empty !== false, c.vc_name_template || "{username}'s Dungeon",
       c.top1_role_id, c.top2_role_id, c.top3_role_id, c.top10_role_id, c.reset_timezone || 'Asia/Kolkata', c.bot_command_channel_id]
    );
    res.json({ success: true, config: result.rows[0] });
  } catch (err) {
    console.error('POST /settings/import error:', err.message);
    res.status(500).json({ error: 'Failed to import settings' });
  }
});

// GET /settings/rewards/:id — list all study hour → role rewards
router.get('/rewards/:id', authorizeGuild, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM study_role_rewards WHERE guild_id = $1 ORDER BY required_hours ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// POST /settings/rewards/:id — create or update a reward milestone
router.post('/rewards/:id', authorizeGuild, async (req, res) => {
  const { required_hours, role_id } = req.body;
  if (required_hours === undefined || !role_id) {
    return res.status(400).json({ error: 'required_hours and role_id are required' });
  }
  try {
    const result = await query(
      `INSERT INTO study_role_rewards (guild_id, required_hours, role_id)
       VALUES ($1,$2,$3)
       ON CONFLICT (guild_id, required_hours) DO UPDATE SET role_id = EXCLUDED.role_id
       RETURNING *`,
      [req.params.id, required_hours, role_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save reward' });
  }
});

// DELETE /settings/rewards/:id/:reward_id
router.delete('/rewards/:id/:reward_id', authorizeGuild, async (req, res) => {
  try {
    await query(
      'DELETE FROM study_role_rewards WHERE id = $1 AND guild_id = $2',
      [req.params.reward_id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete reward' });
  }
});

export default router;
