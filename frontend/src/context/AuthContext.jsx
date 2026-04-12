import React, { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // ─── GATEWAY DETECTION ─────────────────────────────────────────────────────
  const isProd = window.location.hostname.includes('vercel.app');
  const prodApi = 'https://scribe-1r8k.onrender.com';
  const localApi = 'http://localhost:3000';
  
  // Hardened apiUrl resolution
  const internalViteApi = import.meta.env.VITE_API_URL;
  const apiUrl = (internalViteApi || (isProd ? prodApi : localApi)).toString().trim();

  // ─── CENTRALIZED API INSTANCE (Hardened) ───────────────────────────────────
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: apiUrl,
      timeout: 30000, // 30s is more standard
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Defensive Rate Limit Handling
        if (error.response && error.response.status === 429) {
          console.error('⚠️ [SENTINEL]: PORTAL CENSORED (429). HIGH FLUX DETECTED.');
          setIsRateLimited(true);
          setRetryAfter(parseInt(error.response.headers['retry-after'] || 60));
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [apiUrl, token]);

  // Handle URL tokens and rate limits from Gateway
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const errorParam = urlParams.get('error');
    
    if (errorParam === 'rate_limit_cooldown') {
      setIsRateLimited(true);
      setLoading(false);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Identity Verification Loop
  useEffect(() => {
    if (!token || isRateLimited) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const verifyToken = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }
        console.log("Attempting to verify token with API:", apiUrl);
        const res = await api.get('/auth/user');
        if (isSubscribed) {
          setUser(res.data?.user || null);
        }
      } catch (err) {
        console.warn("Token verification failed:", err.message);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    verifyToken();
    return () => { isSubscribed = false; };
  }, [token, api, isRateLimited, apiUrl]);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=1488552752333455481&redirect_uri=${encodeURIComponent(`${apiUrl.replace(/\/$/, '')}/auth/callback`)}&response_type=code&scope=identify%20guilds`;
  
  return (
    <AuthContext.Provider value={{ user, loading, logout, apiUrl, token, isRateLimited, retryAfter, discordAuthUrl, api }}>
      {children}
    </AuthContext.Provider>
  );
};
