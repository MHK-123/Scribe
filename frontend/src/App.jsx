import React, { useContext } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import {
  Settings, Users, Activity, Trophy, Mic, LogOut, Award, Play, Timer, Hexagon, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import DungeonParticles from './components/DungeonParticles.jsx';
import Home             from './pages/Home.jsx';
import Login            from './pages/Login.jsx';
import ServerSelect     from './pages/ServerSelect.jsx';
import DashboardOverview from './pages/DashboardOverview.jsx';
import TempVoiceSetup   from './pages/TempVoiceSetup.jsx';
import VoiceMonitor     from './pages/VoiceMonitor.jsx';
import Leaderboard      from './pages/Leaderboard.jsx';
import SettingsBackup   from './pages/SettingsBackup.jsx';
import LevelRewards     from './pages/LevelRewards.jsx';
import Pomodoro         from './pages/Pomodoro.jsx';
import SetupWizard      from './pages/SetupWizard.jsx';
import AdminDashboard   from './pages/AdminDashboard.jsx';
import Privacy          from './pages/Privacy.jsx';
import Terms            from './pages/Terms.jsx';
import DungeonButton    from './components/DungeonButton.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

// ─── Dynamic Guild Logo ───────────────────────────────────────────────────
const DungeonLogo = ({ title }) => (
  <div className="flex items-center gap-3 group px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer">
    <div className="relative">
      <Hexagon className="text-blue-500 fill-blue-500/20 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all" size={24} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
      </div>
    </div>
    <span className="font-bold text-lg tracking-[0.2em] text-white/90 group-hover:text-white transition-colors uppercase truncate max-w-[200px]">
      {title || 'SCRIBE'}
    </span>
  </div>
);

// ─── Security Guard ──────────────────────────────────────────────────────────
const SessionGuard = ({ children }) => {
  const { logout, token } = useContext(AuthContext);
  
  React.useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.warn('⚡ [Session Guard]: Unauthorized access detected. Revoking access...');
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [logout]);

  return children;
};

// ─── Dashboard Layout ────────────────────────────────────────────────────────
const DashboardLayout = () => {
  const { user, logout, token, apiUrl } = useContext(AuthContext);
  const location = useLocation();
  const guildId  = location.pathname.split('/')[2];
  const [currentGuild, setCurrentGuild] = React.useState(null);

  // Auto-redirect if somehow navigating to an undefined guild
  if (guildId === 'undefined') {
    return <Navigate to="/servers" replace />;
  }

  React.useEffect(() => {
    if (!guildId || !token) return;
    axios.get(`${apiUrl}/guilds/${guildId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setCurrentGuild(res.data))
    .catch(err => {
      console.error('Failed to fetch current guild:', err);
      setCurrentGuild(null);
    });
  }, [guildId, apiUrl, token]);

  const navItems = [
    { name: 'Overview',    path: `/dashboard/${guildId}`,             icon: <Activity size={18}/> },
    { name: 'VC Setup',   path: `/dashboard/${guildId}/setup`,       icon: <Mic size={18}/> },
    { name: 'Monitor',    path: `/dashboard/${guildId}/monitor`,     icon: <Play size={18}/> },
    { name: 'Pomodoro',   path: `/dashboard/${guildId}/pomodoro`,    icon: <Timer size={18}/> },
    { name: 'Leaderboard',path: `/dashboard/${guildId}/leaderboard`, icon: <Trophy size={18}/> },
    { name: 'Rewards',    path: `/dashboard/${guildId}/rewards`,     icon: <Award size={18}/> },
    { name: 'Settings',   path: `/dashboard/${guildId}/settings`,    icon: <Settings size={18}/> },
  ];

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=4b8bf5&color=fff`;

  return (
    <SessionGuard>
      <div className="flex flex-col min-h-screen bg-[#020205] text-slate-200 overflow-hidden relative">
        {/* Background Ambience */}
        <DungeonParticles />

      {/* Top Header */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md border-b border-white/5 shadow-2xl">
        <Link to="/servers" className="no-underline">
          <DungeonLogo title={currentGuild?.name || (location.pathname === '/admin' ? 'CORE SANCTUM' : 'SCRIBE')} />
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <div className="relative">
              <img src={avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full border border-blue-500/50" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full" />
            </div>
            <span className="text-sm font-semibold tracking-wide">{user?.username}</span>
          </div>
          <DungeonButton 
            variant="danger"
            onClick={logout} 
            className="p-2 min-w-0 h-10 w-10"
            icon={LogOut}
            title="Abandon Realm"
          />
        </div>
      </header>

      <div className="flex flex-1 max-w-[1600px] w-full mx-auto relative px-4 py-6 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col gap-1 p-2 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm self-start sticky top-24 shadow-2xl">
          <div className="px-4 py-2 mb-2 text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase opacity-60">Control Nodes</div>
          
          {guildId && navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-rune ${isActive ? 'active' : ''}`}
              >
                <span className="icon-glow">{item.icon}</span>
                <span className="font-semibold tracking-wide text-sm">{item.name}</span>
                {isActive && (
                   <motion.div 
                    layoutId="rune-glow"
                    className="absolute inset-0 bg-blue-500/5 rounded-lg border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                   />
                )}
              </Link>
            );
          })}

          {!guildId && location.pathname === '/admin' && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert size={14} /> Core Admin Mode
            </div>
          )}

          <div className="flex-1 min-h-[40px]" />
          <div className="h-px bg-white/5 my-4 mx-2" />
          <Link to="/servers" className="nav-rune">
            <Users size={18} className="text-slate-400" />
            <span className="text-sm font-semibold">Switch Realm</span>
          </Link>
        </aside>

        {/* Main Interface Area */}
        <main className="flex-1 min-w-0 pb-12 overflow-visible">
          <ErrorBoundary>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  </SessionGuard>
);
};

// ─── Protected Route ─────────────────────────────────────────────────────────
const ProtectedRoute = () => {
  const { user, loading, token } = useContext(AuthContext);
  const location = useLocation();

  // If we are currently verifying identity, manifest the loading portal
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#020205]">
       <div className="relative">
          <Hexagon className="text-blue-500 fill-blue-500/10 animate-[spin_4s_linear_infinite]" size={64} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full animate-ping shadow-[0_0_20px_white]" />
          </div>
       </div>
      <p className="text-slate-500 text-[10px] font-bold tracking-[0.4em] uppercase animate-pulse">Synchronizing Identity...</p>
    </div>
  );

  // If no user and no token, the hunter is unauthorized
  if (!user && !token) {
    console.warn('⚡ [Guard]: No identity detected. Redirecting to login sanctuary.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have a token but user is still null (and loading is somehow false), 
  // we are likely in a 'stale' or 'network error' state. We should NOT redirect, 
  // but instead show a retry or just stay in loading.
  if (!user && token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#020205]">
        <p className="text-slate-500 text-[10px] font-bold tracking-[0.4em] uppercase">Manifesting Realm... (Backend Waking Up)</p>
      </div>
    );
  }

  return <Outlet />;
};

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { isRateLimited } = useContext(AuthContext);

  if (isRateLimited) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-[#020205] text-center px-6 relative overflow-hidden">
        <DungeonParticles />
        
        {/* Cinematic Alert Node */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <div className="relative">
            <ShieldAlert className="text-red-500/80 animate-pulse" size={84} />
            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full -z-10" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-[0.3em] text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Portal Censored
            </h1>
            <p className="text-red-400/80 text-[10px] font-bold tracking-[0.5em] uppercase">
              Cloudflare IP Curse Detected (1015)
            </p>
          </div>

          <div className="w-64 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

          <div className="max-w-md space-y-4">
            <p className="text-slate-400 text-sm leading-relaxed">
              The sanctuary is temporarily shielded. Render's shared gateway is being rate-limited by Discord.
            </p>
            <p className="text-blue-400/90 text-xs font-bold tracking-widest animate-pulse">
              STANDBY: DO NOT REFRESH FOR 5 MINUTES
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Landing Node (Home) */}
      <Route path="/"              element={<Home />} />
      
      {/* Public Auth/Info Nodes */}
      <Route path="/login"         element={<Login />} />
      <Route path="/auth/callback" element={<Login />} />
      <Route path="/privacy"       element={<Privacy />} />
      <Route path="/terms"         element={<Terms />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/setup"   element={<SetupWizard />} />
        <Route path="/servers" element={<ServerSelect />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard/:id"             element={<DashboardOverview />} />
          <Route path="/dashboard/:id/setup"       element={<TempVoiceSetup />} />
          <Route path="/dashboard/:id/monitor"     element={<VoiceMonitor />} />
          <Route path="/dashboard/:id/pomodoro"    element={<Pomodoro />} />
          <Route path="/dashboard/:id/leaderboard" element={<Leaderboard />} />
          <Route path="/dashboard/:id/rewards"     element={<LevelRewards />} />
          <Route path="/dashboard/:id/settings"    element={<SettingsBackup />} />
          <Route path="/admin"                    element={<AdminDashboard />} />
        </Route>
      </Route>
      
      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
