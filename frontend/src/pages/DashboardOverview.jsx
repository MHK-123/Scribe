import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, useAnimation } from 'framer-motion';
import { Users, Clock, Zap, Activity, Sparkles, TrendingUp, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';

export default function DashboardOverview() {
  const { id } = useParams();
  const { token, apiUrl } = useContext(AuthContext);
  const [stats, setStats]         = useState(null);
  const [progress, setProgress]   = useState({ level: 0, total_xp: 0, total_study_hours: 0 });
  const [nextReward, setNextReward] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${apiUrl}/guilds/${id}/stats`,         { headers }),
      axios.get(`${apiUrl}/guilds/${id}/user-progress`, { headers }),
      axios.get(`${apiUrl}/settings/rewards/${id}`,     { headers }),
      axios.get(`${apiUrl}/guilds/${id}/weekly-hours`,  { headers }),
    ]).then(([statsRes, progRes, rewRes, chartRes]) => {
      setStats(statsRes.data);
      setProgress(progRes.data);
      setChartData(chartRes.data);
      const upcoming = rewRes.data.find(r => parseFloat(r.required_hours) > parseFloat(progRes.data.total_study_hours));
      setNextReward(upcoming);
    }).catch(console.error);

    // Socket real-time updates
    const socket = io(apiUrl);
    socket.emit('join_guild_room', id);
    
    socket.on('vc_created', (data) => {
       setStats(s => s ? { ...s, activeVoiceChannels: s.activeVoiceChannels + 1 } : s);
    });
    socket.on('vc_deleted', (data) => {
       setStats(s => s ? { ...s, activeVoiceChannels: Math.max(0, s.activeVoiceChannels - 1) } : s);
    });
    socket.on('user_level_up', (data) => {
       setProgress(p => p ? { ...p, level: data.level, total_xp: data.xp } : p);
    });
    socket.on('role_reward_earned', (data) => {
       // A reward was earned! Re-fetch rewards or assume the user progressed past nextReward
       setNextReward(curr => null); // Quick UI clear, ideally re-fetch
    });

    return () => socket.disconnect();
  }, [id, apiUrl, token]);

  if (!stats) return (
     <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
           {[1,2,3,4].map(i => <div key={i} className="glass-card h-32 rounded-2xl"></div>)}
        </div>
     </div>
  );

  const cards = [
    { title: 'Active Voice Channels', value: stats.activeVoiceChannels, icon: <Activity className="text-blue-400 w-5 h-5"/>, color: 'blue' },
    { title: 'Users Studying', value: stats.usersStudying || 0, icon: <Users className="text-emerald-400 w-5 h-5"/>, color: 'emerald' },
    { title: 'Total Hours Today', value: stats.totalHoursToday, icon: <Clock className="text-purple-400 w-5 h-5"/>, color: 'purple' },
    { title: 'Bot Latency', value: '24ms', icon: <Zap className="text-yellow-400 w-5 h-5"/>, color: 'yellow' }
  ];

  const getColorClasses = (color) => {
     switch(color) {
        case 'blue': return 'bg-blue-500/10 border-blue-500/20';
        case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20';
        case 'purple': return 'bg-purple-500/10 border-purple-500/20';
        case 'yellow': return 'bg-yellow-500/10 border-yellow-500/20';
        default: return 'bg-white/5 border-white/10';
     }
  };

  const nextLvlXp = Math.pow(progress.level + 1, 2) * 100;
  const currentLvlXp = Math.pow(progress.level, 2) * 100;
  const xpProgressPercent = Math.min(100, Math.max(0, ((progress.total_xp - currentLvlXp) / (nextLvlXp - currentLvlXp)) * 100)) || 0;

  return (
    <div className="space-y-8">
      <div>
         <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
         <p className="text-gray-400 mt-1">Real-time metrics and AI insights for your server.</p>
      </div>

      {/* User Progress Banner */}
      <motion.div 
         initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
         className="glass-card rounded-2xl p-6 border border-border/80 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
      >
         <div className="absolute right-0 top-0 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none"></div>
         
         <div className="flex items-center gap-6 w-full md:w-auto relative z-10">
            <div className="relative flex items-center justify-center">
               <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-surface border-border" />
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" 
                     strokeDasharray="226" strokeDashoffset={226 - (226 * xpProgressPercent) / 100} 
                     className="text-accent transition-all duration-1000 ease-out" strokeLinecap="round" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center text-[#ededed]">
                  <span className="text-sm font-bold opacity-50 uppercase tracking-widest -mb-1 mt-1">Lvl</span>
                  <span className="text-2xl font-black leading-none">{progress.level}</span>
               </div>
            </div>
            
            <div>
               <h3 className="text-xl font-bold text-[#ededed]">Your Progress</h3>
               <p className="text-gray-400 text-sm mt-1">{progress.total_xp} / {nextLvlXp} XP • {parseFloat(progress.total_study_hours || 0).toFixed(1)} Hours Total</p>
            </div>
         </div>

         {nextReward && (
            <div className="w-full md:w-auto bg-surface/50 border border-border rounded-xl px-5 py-4 flex items-center gap-4 relative z-10">
               <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Target className="text-emerald-400 w-5 h-5" />
               </div>
               <div>
                  <p className="text-sm text-gray-400 mb-0.5">Next Milestone Reward</p>
                  <p className="font-semibold text-[#ededed] text-sm">
                     Reach <span className="text-emerald-400">{parseFloat(nextReward.required_hours)} hrs</span> to unlock role
                  </p>
               </div>
            </div>
         )}
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {cards.map((card, idx) => (
            <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
               className="glass-card p-6"
            >
               <div className="flex justify-between items-start mb-6">
                  <h3 className="text-gray-400 font-medium text-sm">{card.title}</h3>
                  <div className={`p-2 rounded-lg border ${getColorClasses(card.color)}`}>
                     {card.icon}
                  </div>
               </div>
               
               <div className="flex items-end gap-3">
                  <motion.h2 
                     key={card.value}
                     initial={{ scale: 0.8, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className="text-4xl font-extrabold tracking-tight text-[#ededed]"
                  >
                     {card.value}
                  </motion.h2>
               </div>
            </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Chart Section */}
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 glass-card p-6 min-h-[400px] flex flex-col"
         >
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Study Activity
               </h3>
               <span className="text-xs font-medium px-3 py-1 bg-surface rounded-full border border-border text-gray-400">Past Week</span>
            </div>
            
            <div className="flex-1 w-full h-full min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                   <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                   <Tooltip 
                     contentStyle={{ 
                        backgroundColor: '#0a0a0b', 
                        borderColor: 'rgba(255,255,255,0.08)', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                        color: '#ededed'
                     }} 
                     itemStyle={{ color: '#5e6ad2', fontWeight: 'bold' }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="hours" 
                     stroke="#5e6ad2" 
                     strokeWidth={3} 
                     dot={{ fill: '#0a0a0b', stroke: '#5e6ad2', strokeWidth: 2, r: 4 }} 
                     activeDot={{ r: 6, fill: '#5e6ad2', stroke: '#fff' }}
                     animationDuration={1500}
                   />
                 </LineChart>
               </ResponsiveContainer>
            </div>
         </motion.div>

         {/* AI Coach Card */}
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6 relative overflow-hidden group border-accent/20 flex flex-col justify-between"
         >
            {/* Animated background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/20 blur-[60px] rounded-full pointer-events-none group-hover:bg-accent/30 transition-colors duration-700"></div>
            
            <div>
               <div className="flex items-center gap-2 mb-6 relative z-10">
                  <div className="p-2 bg-accent/10 rounded-lg border border-accent/20">
                     <Sparkles className="text-accent w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                     AI Study Coach
                  </h3>
               </div>
               
               <div className="relative z-10 space-y-4">
                  <p className="text-gray-300 text-sm leading-relaxed">
                     I've analyzed your server's study patterns this week. Here is what I found:
                  </p>
                  
                  <div className="bg-surface/50 border border-border p-4 rounded-xl shadow-inner">
                     <p className="text-[#ededed] leading-relaxed text-sm">
                        Productivity peaks around <span className="text-accent font-bold px-1 bg-accent/10 rounded">9 PM EST</span>. 
                        Users collectively studied <span className="text-emerald-400 font-bold">20% more</span> this week compared to last week. 
                        Consider hosting a group session during peak hours!
                     </p>
                  </div>
               </div>
            </div>
            
            <div className="mt-8 relative z-10">
               <button className="w-full py-2.5 bg-surface hover:bg-surface-hover border border-border rounded-xl text-sm font-medium transition-colors duration-200 shadow-sm flex items-center justify-center gap-2">
                  Generate Full Report
               </button>
            </div>
         </motion.div>
         
      </div>
    </div>
  );
}
