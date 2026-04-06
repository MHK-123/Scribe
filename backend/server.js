import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import guildRoutes from './routes/guilds.js';
import settingsRoutes from './routes/settings.js';
import pomodoroRoutes from './routes/pomodoro.js';
import adminRoutes from './routes/admin.js';
import { initSocket } from './socket.js';
import { initScheduler } from './scheduler.js';

import { config } from './config.js';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const server = http.createServer(app);

// ─── Security Layer: Traffic Shaping ──────────────────────────────────────────
app.set('trust proxy', 1); // Trust first proxy (Cloudflare/Render)
app.use(helmet()); 

// 1. Global IP Rate Limit: Prevents brute-force/DDoS on all endpoints
const globalIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Excessive portal usage. Please wait 15 minutes.' }
});
app.use(globalIpLimiter);

// 2. Per-User API Limit: Prevents a single hunter from flooding Discord/DB
const userApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  keyGenerator: (req) => req.user?.id || req.ip, // Fallback to IP if unauth
  message: { error: 'Hunter activity limit reached. Calibrate your requests.' }
});
// Applied to actual resource routes
app.use(['/guilds', '/settings', '/pomodoro'], userApiLimiter);

// Init Socket.io
initSocket(server);

// Init Scheduler
initScheduler();

app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use('/assets', express.static('public/assets'));

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
app.use('/admin',    adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Study Bot Dashboard API' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
