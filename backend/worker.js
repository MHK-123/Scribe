import { Queue, Worker, QueueEvents } from 'bullmq';
import { config } from './config.js';
import { discordService } from './services/discordService.js';
import { botCache } from './utils/botCache.js';

const connection = {
  url: config.REDIS_URL
};

/**
 * ─── Discord Task Queue ──────────────────────────────────────────────────
 * Manages heavy operations like full guild syncs or mass notifications.
 */
export const discordQueue = new Queue('discord-tasks', { connection });

const worker = new Worker('discord-tasks', async job => {
  const { type, data } = job.data;
  
  console.log(`👷 [Worker]: Processing task [${job.id}] Type: ${type}`);

  switch (type) {
    case 'guild-sync':
      // data: { userId, accessToken }
      console.log(`🔄 [Worker]: Syncing guilds for user ${data.userId}...`);
      await discordService.getUserGuilds(data.userId, data.accessToken);
      break;

    case 'bot-vision-refresh':
      console.log('📡 [Worker]: Refreshing bot vision...');
      await discordService.getBotGuilds();
      break;

    default:
      console.warn(`⚠️ [Worker]: Unknown task type ${type}`);
  }
}, { connection });

worker.on('completed', job => {
  console.log(`✅ [Worker]: Task [${job.id}] completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ [Worker]: Task [${job.id}] FAILED. Artifact:`, err.message);
});

console.log('⚙️ [Sentinel]: Discord Task Worker is online and waiting for rituals.');
