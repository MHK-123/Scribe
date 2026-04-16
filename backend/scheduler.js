import cron from 'node-cron';
import { query } from './db.js';
import { getIO } from './socket.js';

import moment from 'moment-timezone';

export const initScheduler = () => {
  // Run every hour to check for timezones hitting Midnight on the 1st
  cron.schedule('0 * * * *', async () => {
    console.log('--- Hourly Timezone-Aware Reset Check ---');
    try {
      const now = moment().utc();
      const configs = await query('SELECT * FROM guild_configs');

      for (const config of configs.rows) {
        const guildId = config.guild_id;
        const tz = config.reset_timezone || 'Asia/Kolkata';
        
        // Get local time for this guild
        const localTime = moment().tz(tz);
        const currentMonthKey = localTime.format('YYYY-MM');

        // Check: Is it the 1st of the month? Is it 00:00? Has it already been reset this month?
        if (localTime.date() === 1 && localTime.hour() === 0 && config.last_reset_month !== currentMonthKey) {
          console.log(`[Scheduler] Resetting Guild ${guildId} (TimeZone: ${tz})`);
          
          try {
            // "Previous month" for leaderboard history
            const prevMonthDate = localTime.clone().subtract(1, 'month');
            const prevMonth = prevMonthDate.month() + 1;
            const prevYear = prevMonthDate.year();

            // 1. Fetch top users for this SPECIFIC guild from last month
            const topUsersQuery = `
              SELECT user_id, SUM(duration) as total_duration
              FROM study_sessions 
              WHERE guild_id = $1 
                AND EXTRACT(MONTH FROM join_time) = $2
                AND EXTRACT(YEAR FROM join_time) = $3
              GROUP BY user_id
              ORDER BY total_duration DESC
              LIMIT 10
            `;
            const topUsersRes = await query(topUsersQuery, [guildId, prevMonth, prevYear]);
            
            // 2. Archive Monthly Leaderboard
            for (let i = 0; i < topUsersRes.rows.length; i++) {
              const user = topUsersRes.rows[i];
              const hours = user.total_duration / 3600.0;
              await query(
                `INSERT INTO monthly_leaderboards (guild_id, user_id, rank, total_hours, month, year)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (guild_id, user_id, month, year) DO UPDATE SET total_hours = $4, rank = $3`,
                [guildId, user.user_id, i + 1, hours.toFixed(1), prevMonth, prevYear]
              );
            }
            
            // 3. Guild-Specific Reset: Zero out stats for this guild only
            await query('DELETE FROM study_sessions WHERE guild_id = $1', [guildId]);
            await query(
              'UPDATE user_levels SET total_xp = 0, level = 0, total_study_hours = 0, last_updated = CURRENT_TIMESTAMP WHERE guild_id = $1',
              [guildId]
            );

            // 4. Update Lock to prevent double reset
            await query('UPDATE guild_configs SET last_reset_month = $1 WHERE guild_id = $2', [currentMonthKey, guildId]);
            
            // 5. Notify Bot for role stripping + announcement
            const io = getIO();
            io.emit('process_monthly_roles', { guildId, month: prevMonth, year: prevYear });
            io.emit('guild_monthly_reset', { guildId });

          } catch (guildErr) {
            console.error(`[Scheduler] Failed to reset Guild ${guildId}:`, guildErr);
          }
        }
      }
    } catch (err) {
      console.error('[Scheduler] Global check error:', err);
    }
  });
  console.log('Timezone-Aware Scheduler Heartbeat initialized (Hourly).');
};
