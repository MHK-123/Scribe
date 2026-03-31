import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize token state directly from localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').trim();

  // Handle URL tokens on search/refresh
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      console.log('--- AuthContext: Token found in URL ---');
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!token) {
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, apiUrl, token }}>
      {children}
    </AuthContext.Provider>
  );
};
