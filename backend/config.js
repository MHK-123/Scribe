import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'scribe_ritual_secret_v3',
  // Absolute Gateway Anchor: Production sanctuary
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://scribe-azure.vercel.app',
  DISCORD_TOKEN: process.env.TOKEN || process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  DISCORD_OAUTH_REDIRECT_URI: process.env.DISCORD_OAUTH_REDIRECT_URI || 'https://scribe-1r8k.onrender.com/auth/callback',
  ADMIN_IDS: (process.env.ADMIN_IDS || '1407010812081475757').split(',').map(id => id.trim()),
};

// ─── Pre-flight Sentinel ─────────────────────────────────────────────────────
if (!config.DISCORD_TOKEN) {
  console.error('❌ [CRITICAL]: DISCORD_TOKEN is missing! Bot vision will be blind.');
} else if (config.DISCORD_TOKEN.length < 50) {
  console.warn('⚠️ [WARNING]: DISCORD_TOKEN looks unusually short. Verify it is a Bot Token, not a Client Secret.');
}
