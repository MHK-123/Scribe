import cron from 'node-cron';
import { query } from './db.js';
import { getIO } from './socket.js';

export const initScheduler = () => {
  // Run on the first day of every month at 00:00 IST
  // Since server might not be in IST, we specify timezone
  cron.schedule('0 0 1 * *', async () => {
    console.log('--- Running Monthly Leaderboard Reset Task ---');
    try {
      const now = new Date();
      // "Previous month" logic
      const prevMonthDate = new Date();
      prevMonthDate.setMonth(now.getMonth() - 1);
      const prevMonth = prevMonthDate.getMonth() + 1; // 1-12
      const prevYear = prevMonthDate.getFullYear();

      // 1. Get all guilds that have tracking enabled/active users
      const guildsResult = await query('SELECT DISTINCT guild_id FROM study_streaks');
      
      for (const row of guildsResult.rows) {
        const guildId = row.guild_id;
        
        // Ensure configuration exists
        const configRes = await query('SELECT * FROM guild_configs WHERE guild_id = $1', [guildId]);
        if (configRes.rows.length === 0) continue;

        // 2. Fetch top users from last month (we assume current study_streaks tracking keeps lifetime or monthly total. 
        // Wait, if study_streaks is lifetime, we need to sum study_sessions for the specific month to be accurate.)
        
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
        
        // 3. Store historically in monthly_leaderboards
        for (let i = 0; i < topUsersRes.rows.length; i++) {
          const user = topUsersRes.rows[i];
          const hours = user.total_duration / 3600.0;
          await query(
             `INSERT INTO monthly_leaderboards (guild_id, user_id, rank, total_hours, month, year)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (guild_id, user_id, month, year) DO UPDATE SET total_hours = $4, rank = $3`,
             [guildId, user.user_id, i + 1, hours, prevMonth, prevYear]
          );
        }
        
        // Notify Bot to handle discord roles via Socket or Webhook
        // Since bot is likely connected as a socket client (or listen to this event locally via polling), 
        // Emitting event to 'guild_{id}' might not reach the bot if it uses a different mechanism.
        // We will emit globally, the bot should listen to 'process_monthly_roles'
        try {
          const io = getIO();
          io.emit('process_monthly_roles', { guildId, month: prevMonth, year: prevYear });
        } catch(e) { console.error(e) }
      }
      
      console.log('--- Completed Monthly Leaderboard Reset Task ---');
    } catch (err) {
      console.error('Error during monthly reset:', err);
    }
  }, {
    timezone: "Asia/Kolkata"
  });
  console.log('Monthly Role Scheduler initialized.');
};
