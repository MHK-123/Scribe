import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import {
  Settings, Users, Activity, Trophy, Mic, Server, LogOut, Award, Play, Timer
} from 'lucide-react';
import { motion } from 'framer-motion';

import Login            from './pages/Login.jsx';
import ServerSelect     from './pages/ServerSelect.jsx';
import DashboardOverview from './pages/DashboardOverview.jsx';
import TempVoiceSetup   from './pages/TempVoiceSetup.jsx';
import VoiceMonitor     from './pages/VoiceMonitor.jsx';
import Leaderboard      from './pages/Leaderboard.jsx';
import SettingsBackup   from './pages/SettingsBackup.jsx';
import LevelRewards     from './pages/LevelRewards.jsx';
import Pomodoro         from './pages/Pomodoro.jsx';

// ─── Inline Scribe Logo ──────────────────────────────────────────────────────
const ScribeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="icon-glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <linearGradient id="icon-grad" x1="10" y1="10" x2="46" y2="46" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4b8bf5"/><stop offset="1" stopColor="#7b5cf0"/>
      </linearGradient>
    </defs>
    <path d="M14 42 L38 10" stroke="url(#icon-grad)" strokeWidth="2.5" strokeLinecap="round" filter="url(#icon-glow)"/>
    <path d="M38 10 C44 8, 46 16, 38 22" stroke="#4b8bf5" strokeWidth="1.5" fill="rgba(75,139,245,0.1)" filter="url(#icon-glow)"/>
    <circle cx="14" cy="42" r="2.5" fill="#00d4ff" filter="url(#icon-glow)"/>
    <circle cx="14" cy="42" r="1" fill="#fff"/>
  </svg>
);

// ─── Dashboard Layout ────────────────────────────────────────────────────────
const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const guildId  = location.pathname.split('/')[2];

  const navItems = [
    { name: 'Overview',    path: `/dashboard/${guildId}`,             icon: <Activity size={17}/> },
    { name: 'VC Setup',   path: `/dashboard/${guildId}/setup`,       icon: <Mic size={17}/> },
    { name: 'Monitor',    path: `/dashboard/${guildId}/monitor`,     icon: <Play size={17}/> },
    { name: 'Pomodoro',   path: `/dashboard/${guildId}/pomodoro`,    icon: <Timer size={17}/> },
    { name: 'Leaderboard',path: `/dashboard/${guildId}/leaderboard`, icon: <Trophy size={17}/> },
    { name: 'Rewards',    path: `/dashboard/${guildId}/rewards`,     icon: <Award size={17}/> },
    { name: 'Settings',   path: `/dashboard/${guildId}/settings`,    icon: <Settings size={17}/> },
  ];

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=4b8bf5&color=fff`;

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#020209', color:'#e2e8f0' }}>
      {/* Ambient background */}
      <div className="dungeon-bg" aria-hidden="true"/>

      {/* Top Navbar */}
      <header style={{
        position:'sticky', top:0, zIndex:50,
        background:'rgba(2,2,9,0.85)',
        backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(75,139,245,0.12)',
        padding:'0 1.5rem',
        height:'60px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        boxShadow:'0 1px 0 rgba(75,139,245,0.06)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
          <Link to="/servers" style={{
            display:'flex', alignItems:'center', gap:'0.5rem',
            padding:'0.4rem 0.75rem',
            background:'rgba(75,139,245,0.08)',
            border:'1px solid rgba(75,139,245,0.18)',
            borderRadius:'0.5rem',
            textDecoration:'none',
            transition:'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(75,139,245,0.14)'; e.currentTarget.style.borderColor='rgba(75,139,245,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(75,139,245,0.08)'; e.currentTarget.style.borderColor='rgba(75,139,245,0.18)'; }}
          >
            <ScribeIcon size={18}/>
            <span style={{ fontWeight:700, fontSize:'1.05rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#e2e8f0' }}>SCRIBE</span>
          </Link>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{
            display:'flex', alignItems:'center', gap:'0.5rem',
            background:'rgba(8,8,24,0.8)',
            border:'1px solid rgba(75,139,245,0.14)',
            padding:'0.3rem 0.75rem 0.3rem 0.4rem',
            borderRadius:'999px',
          }}>
            <img src={avatarUrl} alt="Avatar" style={{ width:28, height:28, borderRadius:'50%', border:'1px solid rgba(75,139,245,0.3)' }}/>
            <span style={{ fontSize:'0.875rem', fontWeight:600, color:'#c8d6f0' }}>{user?.username}</span>
          </div>
          <button onClick={logout} title="Logout" style={{
            padding:'0.4rem',
            background:'rgba(239,68,68,0.07)',
            border:'1px solid rgba(239,68,68,0.15)',
            borderRadius:'0.5rem',
            color:'#f87171',
            cursor:'pointer',
            display:'flex', alignItems:'center',
            transition:'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.14)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.07)'; }}
          >
            <LogOut size={17}/>
          </button>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, maxWidth:'1600px', width:'100%', margin:'0 auto', position:'relative', zIndex:1 }}>
        {/* Sidebar */}
        <aside style={{
          width:'220px', flexShrink:0,
          padding:'1.5rem 1rem',
          display:'flex', flexDirection:'column',
          borderRight:'1px solid rgba(75,139,245,0.08)',
          gap:'0.25rem',
        }}>
          <div className="section-label" style={{ padding:'0 0.5rem', marginBottom:'0.75rem' }}>NAVIGATION</div>
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{ textDecoration:'none' }}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div style={{ flex:1 }}/>
          <hr className="neon-divider" style={{ margin:'1rem 0' }}/>
          <Link to="/servers" className="nav-link" style={{ textDecoration:'none' }}>
            <Users size={17}/>
            <span>Switch Server</span>
          </Link>
        </aside>

        {/* Main Content */}
        <main style={{ flex:1, padding:'2rem 2.5rem', overflowX:'hidden', minWidth:0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// ─── Protected Route ─────────────────────────────────────────────────────────
const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', background:'#020209' }}>
      <div className="rune-loader"/>
      <p style={{ color:'rgba(136,146,176,0.6)', fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase' }}>Initializing System...</p>
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
};

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/"              element={<Login />} />
          <Route path="/auth/callback" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/servers" element={<ServerSelect />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/:id"             element={<DashboardOverview />} />
              <Route path="/dashboard/:id/setup"       element={<TempVoiceSetup />} />
              <Route path="/dashboard/:id/monitor"     element={<VoiceMonitor />} />
              <Route path="/dashboard/:id/pomodoro"    element={<Pomodoro />} />
              <Route path="/dashboard/:id/leaderboard" element={<Leaderboard />} />
              <Route path="/dashboard/:id/rewards"     element={<LevelRewards />} />
              <Route path="/dashboard/:id/settings"    element={<SettingsBackup />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
