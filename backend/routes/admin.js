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
      const merged = await Promise.all(botGuilds.map(async (guild) => {
        const configRecord = configsMap[guild.id] || null;
        let ownerId = configRecord?.owner_id || guild.ownerId; // Priority: DB -> Bot Cache

        // Fallback ritual: If still unknown, scry the full metadata from Discord
        if (!ownerId || ownerId === 'Unknown') {
          const details = await discordService.getGuildDetails(guild.id);
          if (details && details.owner_id) {
            ownerId = details.owner_id;
            // Record this finding in the ancient scrolls (DB)
            await query(
              'INSERT INTO guild_configs (guild_id, owner_id) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET owner_id = $2',
              [guild.id, ownerId]
            );
          }
        }

        return {
          id: guild.id,
          name: guild.name || 'Unknown Realm',
          icon: guild.icon,
          ownerId: ownerId || 'Unknown',
          memberCount: guild.memberCount || 0,
          config: configRecord
        };
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

/**
 * ─── Reset System ────────────────────────────────────────────────────────────
 */

// POST /admin/guilds/:id/reset - FULL SERVER RESET
router.post('/guilds/:id/reset', async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`🧨 [ADMIN]: Initiating full reset for realm ${id}...`);

    // 1. Fetch all managed role IDs for this guild
    const [configRes, rewardsRes] = await Promise.all([
      query('SELECT top1_role_id, top2_role_id, top3_role_id, top10_role_id FROM guild_configs WHERE guild_id = $1', [id]),
      query('SELECT role_id FROM study_role_rewards WHERE guild_id = $1', [id])
    ]);

    const targetRoleIds = new Set();
    if (configRes.rows[0]) {
      const c = configRes.rows[0];
      if (c.top1_role_id) targetRoleIds.add(c.top1_role_id);
      if (c.top2_role_id) targetRoleIds.add(c.top2_role_id);
      if (c.top3_role_id) targetRoleIds.add(c.top3_role_id);
      if (c.top10_role_id) targetRoleIds.add(c.top10_role_id);
    }
    rewardsRes.rows.forEach(r => targetRoleIds.add(r.role_id));

    // 2. Perform DB Wipe (Level data, leaderboards, and sessions)
    await query('BEGIN');
    try {
      await query('DELETE FROM study_sessions WHERE guild_id = $1', [id]);
      await query('DELETE FROM monthly_leaderboards WHERE guild_id = $1', [id]);
      await query('UPDATE user_levels SET total_xp = 0, level = 0, total_study_hours = 0 WHERE guild_id = $1', [id]);
      await query('COMMIT');
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }

    // 3. Enhanced Role Cleanup (Paginated + Batched)
    const cleanupRoles = async () => {
      try {
        const allMembers = await discordService.listAllGuildMembers(id);
        const membersToStrip = allMembers.filter(m => m.roles.some(r => targetRoleIds.has(r)));
        
        console.log(`🧹 [ADMIN]: Identifying ${membersToStrip.length} members with target roles in realm ${id}...`);

        const BATCH_SIZE = 10;
        for (let i = 0; i < membersToStrip.length; i += BATCH_SIZE) {
          const batch = membersToStrip.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map(async (member) => {
            const rolesOnMember = member.roles.filter(r => targetRoleIds.has(r));
            for (const roleId of rolesOnMember) {
              await discordService.removeGuildMemberRole(id, member.user.id, roleId);
            }
          }));
          // Small safety buffer between batches to allow Discord Gateway to breathe
          await new Promise(r => setTimeout(r, 200));
        }
        console.log(`✅ [ADMIN]: Role purification complete for realm ${id}.`);
      } catch (e) {
        console.error(`❌ [ADMIN]: Role cleanup ritual failed:`, e.message);
      }
    };
    
    // Launch in background
    cleanupRoles();

    res.json({ 
      success: true, 
      message: 'Realm reset complete. All hunter data and level roles have been cleared.' 
    });
  } catch (err) {
    console.error('Admin Full Reset Error:', err);
    res.status(500).json({ error: 'The purification ritual failed.' });
  }
});

// POST /admin/guilds/:id/users/:userId/reset - INDIVIDUAL USER RESET
router.post('/guilds/:id/users/:userId/reset', async (req, res) => {
  const { id, userId } = req.params;

  try {
    // 1. Fetch managed roles
    const [configRes, rewardsRes] = await Promise.all([
      query('SELECT top1_role_id, top2_role_id, top3_role_id, top10_role_id FROM guild_configs WHERE guild_id = $1', [id]),
      query('SELECT role_id FROM study_role_rewards WHERE guild_id = $1', [id])
    ]);

    const roleIds = [];
    if (configRes.rows[0]) {
      const c = configRes.rows[0];
      if (c.top1_role_id) roleIds.push(c.top1_role_id);
      if (c.top2_role_id) roleIds.push(c.top2_role_id);
      if (c.top3_role_id) roleIds.push(c.top3_role_id);
      if (c.top10_role_id) roleIds.push(c.top10_role_id);
    }
    rewardsRes.rows.forEach(r => roleIds.push(r.role_id));

    // 2. DB Wipe for single user
    await query('DELETE FROM study_sessions WHERE guild_id = $1 AND user_id = $2', [id, userId]);
    await query('DELETE FROM monthly_leaderboards WHERE guild_id = $1 AND user_id = $2', [id, userId]);
    await query('UPDATE user_levels SET total_xp = 0, level = 0, total_study_hours = 0 WHERE guild_id = $1 AND user_id = $2', [id, userId]);

    // 3. Role Stripping for single user
    for (const roleId of roleIds) {
      await discordService.removeGuildMemberRole(id, userId, roleId);
    }

    res.json({ success: true, message: `The ritual is complete. Hunter ${userId} has been purified.` });
  } catch (err) {
    console.error('Admin User Reset Error:', err);
    res.status(500).json({ error: 'Could not reset individual hunter progress.' });
  }
});

export default router;
