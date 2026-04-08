import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { discordService } from '../services/discordService.js';

const router = express.Router();

router.get('/login', (req, res) => {
  try {
    const url = new URL('https://discord.com/oauth2/authorize');
    url.searchParams.set('client_id', config.DISCORD_CLIENT_ID);
    url.searchParams.set('redirect_uri', config.DISCORD_OAUTH_REDIRECT_URI);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'identify guilds');
    
    const finalUrl = url.toString();
    console.log('--- OAuth Login Attempt ---');
    console.log('Redirecting to:', finalUrl.replace(config.DISCORD_CLIENT_ID, 'REDACTED'));
    console.log('Redirect URI Base:', config.DISCORD_OAUTH_REDIRECT_URI);
    
    // Using manual header for maximum reliability against hidden characters
    res.writeHead(302, { 'Location': finalUrl });
    res.end();
  } catch (err) {
    console.error('Login URL Construction Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    console.error('OAuth Callback Error: Missing code');
    res.writeHead(302, { 'Location': `${config.FRONTEND_URL}?error=missing_code` });
    return res.end();
  }

  try {
    // 🛡️ [Gateway]: Sentinel Validation Guard
    const clientId = String(config.DISCORD_CLIENT_ID || '').trim();
    const clientSecret = String(config.DISCORD_CLIENT_SECRET || '').trim();
    const redirectUri = String(config.DISCORD_OAUTH_REDIRECT_URI || '').trim();

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('⚠️ [Gateway]: CRITICAL CONFIG VOID DETECTED!');
      console.error('Check your Render Environment Variables:');
      if (!clientId) console.error('  ❌ DISCORD_CLIENT_ID is MISSING');
      if (!clientSecret) console.error('  ❌ DISCORD_CLIENT_SECRET is MISSING');
      if (!redirectUri) console.error('  ❌ DISCORD_OAUTH_REDIRECT_URI is MISSING');
      
      throw new Error(`Handshake denied: Identity credentials are VOID. Redirect URI set to: ${redirectUri || 'NULL'}`);
    }

    console.log(`📡 [Gateway]: Handshake code received: ${code.substring(0, 5)}...`);


    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: String(code || '').trim(),
      redirect_uri: redirectUri
    });

    // 🧪 [Gateway]: Initiating Code Exchange via resilient DiscordService
    const { access_token } = await discordService.exchangeCodeForToken(code);

    // Fetch user info
    const userData = await discordService.getUserInfo(access_token);

    // Create session / JWT
    const token = jwt.sign(
      { 
        id: userData.id, 
        username: userData.username, 
        avatar: userData.avatar,
        access_token: access_token
      }, 
      config.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Redirect to the dashboard with the token
    const redirectDashboardUrl = `${config.FRONTEND_URL}/servers?token=${token}`;
    console.log(`🔗 [Gateway]: Identity handshake SUCCESS for ${userData.username}`);
    res.writeHead(302, { 'Location': redirectDashboardUrl });
    res.end();
  } catch (err) {
    const isRateLimit = err.response?.status === 429;
    const errorType = isRateLimit ? 'rate_limit_cooldown' : 'auth_failed';
    
    console.error('OAuth Code Exchange Error Detail:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });
    
    res.writeHead(302, { 'Location': `${config.FRONTEND_URL}/?error=${errorType}` });
    res.end();
  }
});

router.get('/user', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
