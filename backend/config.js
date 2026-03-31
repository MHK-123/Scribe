import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  PORT:                    process.env.PORT || 3000,
  DATABASE_URL:            process.env.DATABASE_URL,
  JWT_SECRET:              process.env.JWT_SECRET || 'fallback_secret',
  FRONTEND_URL:            process.env.FRONTEND_URL || 'http://localhost:5173',
  DISCORD_TOKEN:           process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID:       process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET:   process.env.DISCORD_CLIENT_SECRET,
  DISCORD_OAUTH_REDIRECT_URI: process.env.DISCORD_OAUTH_REDIRECT_URI,
};
