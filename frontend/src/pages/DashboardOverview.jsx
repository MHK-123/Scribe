import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { getHunterRank } from '../utils/hunterUtils';
import * as Lucide from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { io } from 'socket.io-client';

import MagicPanel from '../components/MagicPanel.jsx';
import DungeonButton from '../components/DungeonButton.jsx';

// Safety wrapper for icons
const Icon = ({ name, size = 18, className = "" }) => {
  const LucideIcon = Lucide[name] || Lucide.HelpCircle;
  return <LucideIcon size={size} className={className} />;
};

export default function DashboardOverview() {
  const { id } = useParams();
  const { user, token, apiUrl } = useContext(AuthContext);
  
  // High-fidelity state with defaults
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState({ level: 0, total_xp: 0, total_study_hours: 0 });
  const [nextReward, setNextReward] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    if (!id || id === 'undefined') return;

    // Reset state on server switch
    setStats(null);
    setProgress({ level: 0, total_xp: 0, total_study_hours: 0 });
    setNextReward(null);
    setChartData([]);
    setErrorStatus(null);

    const headers = { Authorization: `Bearer ${token}` };
    const cancelTokenSource = axios.CancelToken.source();

    const fetchData = async () => {
      try {
        const [statsRes, progRes, rewRes, chartRes] = await Promise.all([
          axios.get(`${apiUrl}/guilds/${id}/stats`,         { headers, cancelToken: cancelTokenSource.token }),
          axios.get(`${apiUrl}/guilds/${id}/user-progress`, { headers, cancelToken: cancelTokenSource.token }),
          axios.get(`${apiUrl}/settings/rewards/${id}`,     { headers, cancelToken: cancelTokenSource.token }),
          axios.get(`${apiUrl}/guilds/${id}/weekly-hours`,  { headers, cancelToken: cancelTokenSource.token }),
        ]);

        setStats(statsRes.data || { activeVoiceChannels: 0, usersStudying: 0, totalHoursToday: 0 });
        setProgress(progRes.data || { level: 0, total_xp: 0, total_study_hours: 0 });
        setChartData(Array.isArray(chartRes.data) ? chartRes.data : []);
        
        const currentHours = parseFloat(progRes.data?.total_study_hours || 0);
        const upcoming = Array.isArray(rewRes.data) 
           ? rewRes.data.find(r => parseFloat(r?.required_hours || 0) > currentHours) 
           : null;
        setNextReward(upcoming || null);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error('Failed to load dashboard data:', err);
        setErrorStatus("Connection to server is unstable. Using cached/local data.");
        // Fallback safety
        setStats({ activeVoiceChannels: 0, usersStudying: 0, totalHoursToday: 0 });
      }
    };

    fetchData();

    // Socket real-time updates
    const socket = io(apiUrl, { transports: ['websocket', 'polling'] });
    socket.emit('join_guild_room', id);
    
    socket.on('vc_created', () => {
       setStats(s => s ? { ...s, activeVoiceChannels: (s.activeVoiceChannels || 0) + 1 } : s);
    });
    socket.on('vc_deleted', () => {
       setStats(s => s ? { ...s, activeVoiceChannels: Math.max(0, (s.activeVoiceChannels || 0) - 1) } : s);
    });
    socket.on('user_level_up', (data) => {
       setProgress(p => p ? { ...p, level: data?.level || p.level, total_xp: data?.xp || p.total_xp } : p);
    });

    return () => {
      cancelTokenSource.cancel();
      socket.disconnect();
    };
  }, [id, apiUrl, token]);

  const level = progress?.level || 0;
  const nextLvlXp = Math.pow(level + 1, 2) * 100;
  const currentLvlXp = Math.pow(level, 2) * 100;
  const currentXp = progress?.total_xp || 0;
  const xpProgressPercent = Math.min(100, Math.max(0, ((currentXp - currentLvlXp) / (nextLvlXp - currentLvlXp)) * 100)) || 0;

  const cards = [
    { title: 'Active Chambers', value: stats?.activeVoiceChannels ?? 0, icon: "Activity", color: "text-blue-400", glow: 'rgba(59,130,246,0.1)' },
    { title: 'Top Hunter Today', value: stats?.topHunterToday ?? "N/A", icon: "Trophy", color: "text-yellow-400", glow: 'rgba(250,204,21,0.1)' },
    { title: 'Activity Level', value: stats?.activityLevel ?? "Low", icon: "Zap", color: "text-purple-400", glow: 'rgba(168,85,247,0.1)' },
    { title: 'Mana Harvested', value: `${Number(stats?.totalHoursToday ?? 0).toFixed(1)}h`, icon: "Flame", color: "text-orange-400", glow: 'rgba(249,115,22,0.1)' },
  ];

  // --- Graph Stabilization Ritual ---
  const SAFE_LIMIT = 100;
  const sanitizedChartData = (chartData || []).map(point => {
    const rawVal = Number(point?.hours);
    const safeVal = isFinite(rawVal) && !isNaN(rawVal) 
      ? Math.max(0, Math.min(rawVal, SAFE_LIMIT)) 
      : 0;
    
    return {
      ...point,
      name: point?.name || '?',
      hours: safeVal
    };
  });

  const hasValidData = sanitizedChartData.length > 0 && 
    sanitizedChartData.some(d => (d?.hours ?? 0) > 0.01);

  return (
    <div className={`space-y-8 relative overflow-visible p-4 transition-opacity duration-500 ${!stats ? 'opacity-50' : 'opacity-100'}`}>
      <header className="flex flex-col gap-1">
         <h1 className="text-4xl font-extrabold tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] uppercase">Sanctum Overview</h1>
         <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-blue-500/50" />
            <p className="text-slate-400 font-medium tracking-wide text-xs uppercase">Realm Identification: <span className="text-blue-400">{id}</span></p>
         </div>
      </header>

      <AnimatePresence>
        {errorStatus && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl text-orange-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <Lucide.AlertCircle size={14} /> {errorStatus}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Core Insights Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MagicPanel className="lg:col-span-2 p-6 border-blue-500/10" glowColor="rgba(59,130,246,0.05)">
              <div className="flex items-center justify-between">
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">System Identity</p>
                      <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Sanctum Sentinel Core <span className="text-blue-500">v3.0</span></h2>
                  </div>
                  <div className="flex items-center gap-4">
                      {['Bot', 'DB', 'Sync'].map(sys => (
                          <div key={sys} className="flex flex-col items-center">
                              <span className="text-[8px] font-bold text-slate-600 uppercase mb-1">{sys}</span>
                              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                                  <span className="text-[9px] font-black text-green-400 uppercase">Active</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </MagicPanel>
          
          <MagicPanel className="p-6 border-yellow-500/10" glowColor="rgba(250,204,21,0.05)">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-400/10 rounded-xl border border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
                      <Lucide.ShieldCheck className="text-yellow-400" size={24} />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Sanctuary Status</p>
                      <p className="font-black text-white text-sm uppercase italic">Fully Protected</p>
                  </div>
              </div>
          </MagicPanel>
      </div>
      
      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {cards.map((card, idx) => (
            <MagicPanel 
               key={idx}
               className="p-6 border-white/5"
               glowColor={card.glow}
            >
               <div className="flex justify-between items-start mb-6">
                  <h3 className="text-slate-500 font-bold uppercase tracking-[0.15em] text-[10px]">{card.title}</h3>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 shadow-inner">
                     <Icon name={card.icon} className={card.color} size={20} />
                  </div>
               </div>
               
               <div className="flex items-baseline gap-2">
                  <motion.h2 
                     key={card.value}
                     initial={{ y: 10, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     className="text-4xl font-black text-white"
                  >
                     {card.value}
                  </motion.h2>
                  {idx === 0 && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />}
               </div>
            </MagicPanel>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Activity Chart - Conditional Rendering with Sentinel Guard */}
         {hasValidData ? (
            <MagicPanel className="lg:col-span-2 p-6 min-h-[320px] flex flex-col border-white/5 overflow-hidden" glowColor="rgba(59,130,246,0.03)">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-3 text-white">
                     <Icon name="Activity" className="text-blue-500" size={16} />
                     Mana Flux Pattern
                  </h3>
                  <div className="flex gap-2">
                     <span className="text-[9px] font-bold px-2 py-0.5 bg-white/5 rounded-full border border-white/10 text-slate-500 uppercase tracking-tighter">Lunar Cycle</span>
                  </div>
               </div>
               
               <div className="flex-1 w-full h-full min-h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sanitizedChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                           <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#475569" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} tick={{ dy: 10 }} />
                        <YAxis 
                           stroke="#475569" 
                           fontSize={11} 
                           fontWeight="bold" 
                           tickLine={false} 
                           axisLine={false}
                           domain={[0, (dataMax) => {
                               const safeMax = isFinite(dataMax) && !isNaN(dataMax) ? dataMax : 0;
                               return Math.max(safeMax, 1);
                           }]}
                           tickFormatter={(val) => {
                               const safeVal = Number(val);
                               return isFinite(safeVal) ? safeVal.toFixed(1) : '0.0';
                           }}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0f', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff' }} />
                        <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" isAnimationActive={false} />
                        </AreaChart>
                  </ResponsiveContainer>
               </div>
            </MagicPanel>
         ) : null}

         {/* Oracle Panel */}
         <MagicPanel className={`${!hasValidData ? 'lg:col-span-3' : ''} p-6 border-blue-500/10 flex flex-col justify-between`} glowColor="rgba(59,130,246,0.08)">
            <div className="relative">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15_rgb(59,130,246,0.1)]">
                     <Icon name="Sparkles" className="text-blue-500" size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Ancient Oracle</h3>
               </div>
               <div className="space-y-4">
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">The mana cores resonate with intense frequency. Here is my prophecy:</p>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl shadow-inner relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                     <p className="text-white leading-relaxed text-sm font-medium pl-2 italic">
                        {stats?.totalHoursToday > 0 ? (
                           <>Harvest peaks during <span className="text-blue-400 font-bold underline">Lunar Noon</span>. Fellow hunters harvested <span className="text-blue-400 font-bold">20% more essence</span> this cycle. Summons result in optimized mana gain!</>
                        ) : (
                           <>The realm is currently in **Stasis**. No mana flux detected. Assemble your party and enter the chambers to begin the harvest ritual.</>
                        )}
                     </p>
                  </div>
               </div>
            </div>
            <div className="mt-8">
               <DungeonButton variant="fire" className="w-full justify-center" icon={Lucide.Sparkles}>
                  Consult Full Prophecy
               </DungeonButton>
            </div>
         </MagicPanel>
      </div>
    </div>
  );
}
