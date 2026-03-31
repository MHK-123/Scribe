import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import guildRoutes from './routes/guilds.js';
import settingsRoutes from './routes/settings.js';
import pomodoroRoutes from './routes/pomodoro.js';
import { initSocket } from './socket.js';
import { initScheduler } from './scheduler.js';

import { config } from './config.js';

const app = express();
const server = http.createServer(app);

// Init Socket.io
initSocket(server);

// Init Scheduler
initScheduler();

app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// Health Check Route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    frontendUrl: config.FRONTEND_URL,
    redirectUri: config.DISCORD_OAUTH_REDIRECT_URI,
    time: new Date().toISOString()
  });
});

app.use('/auth',     authRoutes);
app.use('/guilds',   guildRoutes);
app.use('/settings', settingsRoutes);
app.use('/pomodoro', pomodoroRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Study Bot Dashboard API' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
