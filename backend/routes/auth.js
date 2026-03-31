import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

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
    const params = new URLSearchParams({
      client_id: config.DISCORD_CLIENT_ID,
      client_secret: config.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.DISCORD_OAUTH_REDIRECT_URI
    });

    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenRes.data;

    // Fetch user info
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userData = userRes.data;

    // Create session / JWT
    const token = jwt.sign(
      { 
        id: userData.id, 
        username: userData.username, 
        avatar: userData.avatar,
        discord_access_token: access_token
      }, 
      config.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Redirect to the dashboard with the token
    const redirectDashboardUrl = `${config.FRONTEND_URL}/servers?token=${token}`;
    console.log('Redirecting to dashboard Success');
    res.writeHead(302, { 'Location': redirectDashboardUrl });
    res.end();
  } catch (err) {
    console.error('OAuth Code Exchange Error Detail:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });
    res.writeHead(302, { 'Location': `${config.FRONTEND_URL}?error=auth_failed` });
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
