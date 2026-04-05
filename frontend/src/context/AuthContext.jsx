import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize token state directly from localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  // ─── GATEWAY DETECTION: AUTOMATIC PRODUCTION HANDSHAKE ─────────────────────
  const isProd = window.location.hostname.includes('vercel.app');
  const prodApi = 'https://scribe-backend-nasb.onrender.com';
  const localApi = 'http://localhost:3000';
  
  const apiUrl = (import.meta.env.VITE_API_URL || (isProd ? prodApi : localApi)).trim();

  useEffect(() => {
    console.log(`--- [SENTINEL]: Initializing Identity Node ---`);
    console.log(`--- [SENTINEL]: Target Gateway: ${apiUrl} ---`);
    console.log(`--- [SENTINEL]: Origin Domain: ${window.location.hostname} ---`);
  }, [apiUrl]);

  // Handle URL tokens and rate limits
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const errorParam = urlParams.get('error');
    
    if (errorParam === 'rate_limit_cooldown') {
      console.error('⚠️ [SENTINEL]: PORTAL CENSORED BY CLOUDFLARE (1015). COOLDOWN ACTIVE.');
      setIsRateLimited(true);
      setLoading(false);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (urlToken) {
      console.log('--- AuthContext: Token found in URL ---');
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!token || isRateLimited) {
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        console.log('--- AuthContext: Verifying token ---');
        const res = await axios.get(`${apiUrl}/auth/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('--- AuthContext: User verified ---');
        setUser(res.data.user);
      } catch (err) {
        console.error('--- AuthContext: Verification error ---', err.response?.status || err.message);
        
        // ONLY remove token if it's a definitive auth failure (401 Unauthorized or 403 Forbidden)
        // If it's a 502/504 (bad gateway/timeout) or network error, KEEP the token and try again later.
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.warn('--- AuthContext: Session expired or invalid, cleaning up ---');
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, apiUrl]);

  const login = (newToken, userData) => {
    console.log('--- AuthContext: Logging in ---');
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    console.log('--- AuthContext: Logging out ---');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=1488552752333455481&redirect_uri=${encodeURIComponent(`${apiUrl}/auth/callback`)}&response_type=code&scope=identify%20guilds`;
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, apiUrl, token, isRateLimited, discordAuthUrl }}>
      {children}
    </AuthContext.Provider>
  );
};
