import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeGuild } from '../middleware/guildAuth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ── GET /pomodoro/:guildId/configs ────────────────────────────────────────────
router.get('/:guildId/configs', authorizeGuild, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM pomodoro_configs WHERE guild_id = $1 ORDER BY id ASC',
      [req.params.guildId]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /pomodoro configs error:', err.message);
    res.status(500).json({ error: 'Failed to fetch Pomodoro configs' });
  }
});

// ── POST /pomodoro/:guildId/config ────────────────────────────────────────────
router.post('/:guildId/config', authorizeGuild, async (req, res) => {
  const { guildId }   = req.params;
  const {
    voice_channel_id,
    text_channel_id,
    focus_duration = 50,
    break_duration = 10,
    auto_start     = true,
    auto_stop      = true,
  } = req.body;

  console.log(`[Pomodoro] Saving Config for ${guildId}: focus=${focus_duration}`);

  if (!voice_channel_id || !text_channel_id) {
    return res.status(400).json({ error: 'voice_channel_id and text_channel_id are required' });
  }

  try {
    // ── Enforce per-server config cap (max 5) ─────────────────────────────
    const { rows: existing } = await pool.query(
      'SELECT voice_channel_id FROM pomodoro_configs WHERE guild_id = $1',
      [guildId]
    );
    const isUpdate = existing.some(r => r.voice_channel_id === voice_channel_id);
    if (!isUpdate && existing.length >= 5) {
      return res.status(400).json({ error: 'Maximum of 5 Pomodoro configs per server reached.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO pomodoro_configs
         (guild_id, voice_channel_id, text_channel_id, focus_duration, break_duration,
          cycles, auto_start, auto_stop)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (guild_id, voice_channel_id) DO UPDATE SET
         text_channel_id = EXCLUDED.text_channel_id,
         focus_duration  = EXCLUDED.focus_duration,
         break_duration  = EXCLUDED.break_duration,
         auto_start      = EXCLUDED.auto_start,
         auto_stop       = EXCLUDED.auto_stop
       RETURNING *`,
      [guildId, voice_channel_id, text_channel_id,
       focus_duration, break_duration, 0, auto_start, auto_stop]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('POST /pomodoro config error:', err.message);
    res.status(500).json({ error: 'Failed to save Pomodoro config' });
  }
});

// ── DELETE /pomodoro/:guildId/config/:id ──────────────────────────────────────
router.delete('/:guildId/config/:id', authorizeGuild, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM pomodoro_configs WHERE id = $1 AND guild_id = $2',
      [req.params.id, req.params.guildId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /pomodoro config error:', err.message);
    res.status(500).json({ error: 'Failed to delete config' });
  }
});

// ── GET /pomodoro/:guildId/sessions ───────────────────────────────────────────
router.get('/:guildId/sessions', authorizeGuild, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, c.focus_duration, c.break_duration, c.cycles
       FROM pomodoro_sessions s
       JOIN pomodoro_configs  c  ON c.guild_id = s.guild_id AND c.voice_channel_id = s.voice_channel_id
       WHERE s.guild_id = $1 AND s.is_active = TRUE
       ORDER BY s.started_at DESC`,
      [req.params.guildId]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /pomodoro sessions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

export default router;
