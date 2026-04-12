import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { ShieldAlert, Users, Database, Activity, Skull, LogOut, Globe, Zap, Search, Settings2, Power, PowerOff } from 'lucide-react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

import MagicPanel from '../components/MagicPanel.jsx';
import DungeonButton from '../components/DungeonButton.jsx';

export default function AdminDashboard() {
  const { token, apiUrl } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [sRes, gRes] = await Promise.all([
          axios.get(`${apiUrl}/admin/stats`, { headers }),
          axios.get(`${apiUrl}/admin/guilds`, { headers })
        ]);
        setStats(sRes.data);
        setGuilds(gRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Core Sanctum Scrying Error:', err);
        setError(err.response?.data?.error || 'Lost connection to the Core Sanctum.');
        setLoading(false);
      }
    };
    fetchAdminData();

    // Socket for real-time updates
    const socket = io(apiUrl.replace('/api', ''));
    socket.on('admin_guild_update', (updatedGuilds) => {
      setGuilds(prev => prev.map(g => {
        const match = updatedGuilds.find(ug => ug.id === g.id);
        return match ? { ...g, ...match } : g;
      }));
    });

    return () => socket.disconnect();
  }, [apiUrl, token]);

  const handleToggleFeature = async (guildId, feature, currentValue) => {
    try {
      await axios.patch(`${apiUrl}/admin/guilds/${guildId}/features`, 
        { feature, value: !currentValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setGuilds(prev => prev.map(g => {
        if (g.id === guildId) {
          return {
            ...g,
            config: { ...g.config, [feature]: !currentValue }
          };
        }
        return g;
      }));
    } catch (err) {
      alert("Transformation ritual failed.");
    }
  };

  const handleLeave = async (id, name) => {
    if (!window.confirm(`Sever all ties to the realm: ${name}? This action is irreversible.`)) return;
    try {
      await axios.delete(`${apiUrl}/admin/guilds/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuilds(prev => prev.filter(g => g.id !== id));
    } catch (e) {
      alert("The ritual failed. The realm remains connected.");
    }
  };

  const handleResetRealm = async (id, name) => {
    if (!window.confirm(`🔥 DANGER: Wipe all progress and roles for ${name}? This will purge the leaderboard and reset all hunters to zero.`)) return;
    if (!window.confirm(`FINAL CONFIRMATION: Are you absolutely sure? This ritual is permanent.`)) return;
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${apiUrl}/admin/guilds/${id}/reset`, {}, { headers });
      alert(res.data.message || "The realm has been purified.");
    } catch (err) {
      alert("The purification ritual failed: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  const handleResetUser = async (guildId, userId) => {
    if (!guildId || !userId) return alert("You must provide both Realm and Hunter IDs.");
    if (!window.confirm(`Purge all progress for hunter ${userId} in realm ${guildId}?`)) return;
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${apiUrl}/admin/guilds/${guildId}/users/${userId}/reset`, {}, { headers });
      alert(res.data.message || "The hunter has been reset.");
    } catch (err) {
      alert("Failed to reset hunter: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  const filteredGuilds = guilds.filter(g => 
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.id?.includes(searchTerm)
  );

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
       <div className="relative">
          <Globe className="text-red-500 animate-[spin_10s_linear_infinite]" size={64} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="text-white animate-pulse" size={24} />
          </div>
       </div>
       <p className="text-slate-500 text-[10px] font-bold tracking-[0.4em] uppercase animate-pulse">Scrying All Active Realms...</p>
    </div>
  );

  if (error) return (
    <div className="p-12 text-center space-y-4">
       <Skull size={48} className="mx-auto text-red-500/50" />
       <h2 className="text-xl font-bold text-white uppercase tracking-tighter italic">Access Forbidden</h2>
       <p className="text-slate-500 text-sm max-w-sm mx-auto">{error}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <header className="space-y-2">
        <div className="text-[10px] font-bold tracking-[0.3em] text-red-500 uppercase">Grand Administrator</div>
        <h1 className="text-5xl font-black tracking-tighter text-white flex items-center gap-5 uppercase">
           <ShieldAlert className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]" size={40} />
           Core Sanctum
        </h1>
        <p className="text-slate-400 font-medium max-w-xl">
           The central node of the study network. Monitor global mana harvest and manage server connections from the rift.
        </p>
      </header>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MagicPanel className="p-8 group relative overflow-hidden" glowColor="rgba(239,68,68,0.15)">
           <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 group-hover:border-red-500/40 transition-colors">
              <Database className="text-red-400" size={24} />
           </div>
           <div className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Populated Realms</div>
           <div className="text-5xl font-black text-white tracking-tighter">{stats.totalGuilds}</div>
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <ShieldAlert size={80} />
           </div>
        </MagicPanel>

        <MagicPanel className="p-8 group relative overflow-hidden" glowColor="rgba(59,130,246,0.15)">
           <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:border-blue-500/40 transition-colors">
              <Users className="text-blue-400" size={24} />
           </div>
           <div className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Active Hunters</div>
           <div className="text-5xl font-black text-white tracking-tighter">{stats.totalUsers}</div>
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <Activity size={80} />
           </div>
        </MagicPanel>

        <MagicPanel className="p-8 group relative overflow-hidden" glowColor="rgba(168,85,247,0.15)">
           <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:border-purple-500/40 transition-colors">
              <Globe className="text-purple-400" size={24} />
           </div>
           <div className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Mana Harvested</div>
           <div className="text-5xl font-black text-white tracking-tighter">{stats.totalHours}h</div>
           <div className="text-[10px] font-bold text-slate-500 mt-2">TOTAL NETWORK UPTIME</div>
        </MagicPanel>
      </div>

      {/* Guild Manifest */}
      <MagicPanel className="border-white/5 overflow-hidden shadow-2xl" glowColor="rgba(239,68,68,0.03)">
         <div className="px-8 py-6 border-b border-white/5 bg-white/[0.03] flex flex-col md:flex-row justify-between items-md-center gap-4">
           <div>
              <h3 className="text-sm font-black tracking-[0.2em] text-white uppercase italic">Active Guild Manifest</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Live Feed • {guilds.length} Active Connections</p>
           </div>
           
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input 
                type="text" 
                placeholder="Search Realms..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-10 py-2.5 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-red-500/40 w-full md:w-64 transition-all"
              />
           </div>
         </div>

         <div className="divide-y divide-white/5 bg-[#050508]/50">
           <AnimatePresence>
             {filteredGuilds.map((g, idx) => (
                <motion.div 
                  key={g.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-8 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group/row"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover/row:border-red-500/20 transition-all">
                      {g.icon ? (
                         <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`} className="w-full h-full object-cover shadow-2xl" />
                      ) : (
                         <Skull size={24} className="text-slate-700" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                       <div className="font-black text-white text-base tracking-tight uppercase italic">{g.name}</div>
                       <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                             <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest leading-none">Realm ID</div>
                             <span className="text-[10px] font-mono text-slate-500 border border-white/5 px-2 py-0.5 rounded italic bg-white/[0.02]">{g.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="text-[10px] font-bold text-red-900/40 uppercase tracking-widest leading-none">Owner ID</div>
                             <span className="text-[10px] font-mono text-red-400 border border-red-500/10 px-2 py-0.5 rounded italic bg-red-500/[0.02] cursor-pointer hover:bg-red-500/10 transition-colors" title="Click to copy ID" onClick={() => { navigator.clipboard.writeText(g.ownerId); alert('Owner ID copied to scrolls.'); }}>{g.ownerId || 'Unknown'}</span>
                          </div>
                       </div>
                    </div>
                  </div>

                   <div className="flex items-center gap-12">
                      {/* Stats */}
                      <div className="hidden lg:flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Hunters</div>
                          <div className="text-sm font-black text-white">{g.memberCount || '—'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">VC Node</div>
                          <div className="text-sm font-black text-blue-400">{g.activeVCCount || 0}</div>
                        </div>
                      </div>

                      {/* Feature Toggles */}
                      <div className="flex items-center gap-3">
                        <FeatureToggle 
                          active={g.config?.is_vc_control_enabled} 
                          icon={Settings2} 
                          label="VC CTRL"
                          onClick={() => handleToggleFeature(g.id, 'is_vc_control_enabled', g.config?.is_vc_control_enabled)}
                        />
                        <FeatureToggle 
                          active={g.config?.is_pomodoro_enabled} 
                          icon={Activity} 
                          label="POMO"
                          onClick={() => handleToggleFeature(g.id, 'is_pomodoro_enabled', g.config?.is_pomodoro_enabled)}
                        />
                      </div>

                      <DungeonButton 
                        variant="fire" 
                        className="h-10 px-6 text-[10px]"
                        onClick={() => handleResetRealm(g.id, g.name)}
                      >
                        Reset
                      </DungeonButton>

                      <DungeonButton 
                        variant="danger" 
                        className="h-10 px-6 text-[10px]"
                        onClick={() => handleLeave(g.id, g.name)}
                      >
                        Sever
                      </DungeonButton>
                   </div>
                </motion.div>
             ))}
           </AnimatePresence>
           
           {filteredGuilds.length === 0 && (
              <div className="py-20 text-center space-y-4">
                 <Skull size={32} className="mx-auto text-slate-800" />
                 <p className="text-slate-600 text-xs font-bold uppercase tracking-widest italic">No realms found in the current rift visibility.</p>
              </div>
           )}
         </div>
      </MagicPanel>

      {/* Manual Override Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <MagicPanel className="p-8 border-red-500/10 bg-red-500/[0.02]" glowColor="rgba(239,68,68,0.1)">
            <h3 className="text-sm font-black tracking-[0.2em] text-white uppercase italic mb-6 flex items-center gap-3">
               <ShieldAlert className="text-red-500" size={18} />
               Individual Hunter Reset
            </h3>
            <div className="space-y-4">
               <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase tracking-tighter">
                  Purge all XP, Levels, and Roles for a specific hunter across a realm. 
                  <span className="text-red-500/80 block mt-1">WARNING: This ritual cannot be undone.</span>
               </p>
               <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                     <input 
                        id="reset-guild-id"
                        type="text" 
                        placeholder="Realm ID (Guild)" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-700 focus:border-red-500/40 outline-none transition-all"
                     />
                  </div>
                  <div className="flex-1 space-y-2">
                     <input 
                        id="reset-user-id"
                        type="text" 
                        placeholder="Hunter ID (User)" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-700 focus:border-red-500/40 outline-none transition-all"
                     />
                  </div>
               </div>
               <DungeonButton 
                  variant="fire" 
                  className="w-full justify-center py-4 bg-red-600 hover:bg-red-500"
                  icon={Skull}
                  onClick={() => {
                     const gId = document.getElementById('reset-guild-id').value;
                     const uId = document.getElementById('reset-user-id').value;
                     handleResetUser(gId, uId);
                  }}
               >
                  Initiate User Wipe
               </DungeonButton>
            </div>
         </MagicPanel>

         <MagicPanel className="p-8 border-slate-500/10 opacity-50 pointer-events-none">
            <h3 className="text-sm font-black tracking-[0.2em] text-slate-500 uppercase italic mb-6">Network Health</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  <span>API Latency</span>
                  <span>14ms</span>
               </div>
               <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-green-500/50" />
               </div>
               <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  <span>Worker Load</span>
                  <span>2.4%</span>
               </div>
               <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div className="w-1/12 h-full bg-blue-500/50" />
               </div>
            </div>
         </MagicPanel>
      </div>

      {/* Confirmation State (Simple alert/confirm for now, following user request of confirmation step) */}
    </div>
  );
}

// Logic helpers moved to main component scope (or added to handle functions)
// ... in AdminDashboard.jsx

function FeatureToggle({ active, icon: Icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${
        active 
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
          : 'bg-white/5 border-white/5 text-slate-600 grayscale'
      }`}
      title={`${active ? 'Disable' : 'Enable'} ${label}`}
    >
      <Icon size={14} />
      <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}
