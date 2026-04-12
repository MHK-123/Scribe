import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Search } from 'lucide-react';
import { getHunterRank } from '../utils/hunterUtils';

export default function Leaderboard() {
  const { id } = useParams();
  const { token, apiUrl } = useContext(AuthContext);
  const [filter, setFilter] = useState('monthly');
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  // High-fidelity fallback/demo data
  const demoLeaders = [
    { user_id: 'demo1', username: 'Shadow Walker', total_hours: '154.2', rank: 1, avatar_url: null },
    { user_id: 'demo2', username: 'Void Hunter', total_hours: '128.5', rank: 2, avatar_url: null },
    { user_id: 'demo3', username: 'Mana Weaver', total_hours: '94.8', rank: 3, avatar_url: null },
    { user_id: 'demo4', username: 'Soul Seeker', total_hours: '82.1', rank: 4, avatar_url: null },
    { user_id: 'demo5', username: 'Dungeon Master', total_hours: '75.3', rank: 5, avatar_url: null },
  ];

  useEffect(() => {
    setLoading(true);
    setLeaders([]); 
    axios.get(`${apiUrl}/guilds/${id}/leaderboard?type=${filter}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      // Use real data if exists, otherwise show demo set
      setLeaders(data.length > 0 ? data : demoLeaders.map(d => ({ ...d, isDemo: true })));
    })
    .catch(err => {
      console.error(err);
      setLeaders(demoLeaders.map(d => ({ ...d, isDemo: true })));
    })
    .finally(() => setLoading(false));
  }, [filter, id, apiUrl, token]);

  const getRankBadge = (rank) => {
    if (rank === 1) return <div className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-500 flex items-center justify-center font-bold border border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]">1</div>;
    if (rank === 2) return <div className="w-8 h-8 rounded-full bg-slate-300/20 text-slate-300 flex items-center justify-center font-bold border border-slate-300/50">2</div>;
    if (rank === 3) return <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold border border-orange-500/50">3</div>;
    return <div className="w-8 h-8 rounded-full bg-surface text-gray-400 flex items-center justify-center font-bold">{rank}</div>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Hall of Champions</h1>
            <p className="text-gray-400 font-medium">Behold the hunters who have harvested the most mana this cycle.</p>
         </div>
         
         {/* Sleek Tab Toggles */}
         <div className="flex p-1 bg-surface border border-border rounded-xl w-fit">
            {[
              { id: 'monthly', label: 'Monthly Flux' },
              { id: 'last_month', label: 'Previous Cycle' },
              { id: 'all_time', label: 'Ancient Records' }
            ].map(f => (
               <button 
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-200 relative ${
                    filter === f.id ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                  }`}
               >
                  {filter === f.id && (
                     <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white/10 border border-white/20 rounded-lg"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                     />
                  )}
                  <span className="relative z-10 italic">{f.label}</span>
               </button>
            ))}
         </div>
      </div>
      
      <div className="glass-card rounded-2xl overflow-hidden border border-border/60 relative">
        {/* Demo Watermark */}
        {leaders.some(l => l.isDemo) && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0 opacity-[0.03]">
             <div className="text-[200px] font-black uppercase -rotate-45 whitespace-nowrap select-none">MOCKED REALM · MOCKED REALM</div>
          </div>
        )}

        {/* Search / Filter Bar area (visual only for now) */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface-hover/20 relative z-10">
           <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Seek a specific hunter..." 
                className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-[#ededed] placeholder-gray-500 focus:outline-none focus:border-accent/50 transition-colors italic"
                disabled
              />
           </div>
           {leaders.some(l => l.isDemo) ? (
              <div className="text-xs text-orange-400 flex items-center gap-1.5 font-black uppercase tracking-widest bg-orange-400/10 px-3 py-1.5 rounded-lg border border-orange-400/20">
                 <Search size={14} className="animate-pulse" /> Manifesting Data...
              </div>
           ) : (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-black uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
                 <Trophy size={14} /> Current Race
              </div>
           )}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto relative z-10">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="border-b border-white/5 text-[10px] text-gray-400 uppercase tracking-[0.2em] bg-surface/30 font-black italic">
                    <th className="py-4 px-6 text-center">Rank</th>
                    <th className="py-4 px-6">Identified Hunter</th>
                    <th className="py-4 px-6 text-right">Mana Harvested</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                 <AnimatePresence mode="wait">
                    {loading ? (
                       <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td colSpan="3" className="py-20 text-center">
                             <div className="inline-flex items-center gap-3 text-gray-400 text-xs font-black uppercase tracking-widest italic">
                                <span className="w-4 h-4 rounded-full border-2 border-accent border-r-transparent animate-spin"></span>
                                Scrying Ancient Scrolls...
                             </div>
                          </td>
                       </motion.tr>
                    ) : (
                       leaders.map((user, idx) => (
                          <motion.tr 
                             key={user.user_id}
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: -10 }}
                             transition={{ delay: idx * 0.03, duration: 0.2 }}
                             className={`group hover:bg-surface-hover/50 transition-colors ${user.isDemo ? 'opacity-60 grayscale-[0.5]' : ''}`}
                          >
                             <td className="py-4 px-6 text-center">
                                <div className="flex justify-center italic">
                                   {getRankBadge(user.rank || idx + 1)}
                                </div>
                             </td>
                             <td className="py-4 px-6">
                                <div className="flex items-center gap-4">
                                   <div className="relative shrink-0">
                                      {user.avatar_url ? (
                                         <img src={user.avatar_url} className="w-10 h-10 rounded-xl border border-white/10 shadow-lg group-hover:border-accent/40 transition-colors" />
                                      ) : (
                                         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-300 uppercase italic shadow-inner">
                                            {user.username?.charAt(0) || '?'}
                                         </div>
                                      )}
                                      {idx === 0 && !user.isDemo && (
                                         <div className="absolute -top-1.5 -right-1.5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                                            <Trophy size={14} />
                                         </div>
                                      )}
                                   </div>
                                    <div>
                                       <div 
                                          className="font-black transition-colors uppercase tracking-[0.15em] italic text-sm"
                                          style={{ color: getHunterRank(user.level, user.rank || idx + 1).color, textShadow: `0 0 10px ${getHunterRank(user.level, user.rank || idx + 1).shadow}` }}
                                       >
                                          {getHunterRank(user.level, user.rank || idx + 1).label}
                                       </div>
                                       <div className="flex items-center gap-2 mt-0.5">
                                          <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest italic truncate max-w-[120px]">
                                             @{user.username}
                                          </div>
                                          <div className="text-[8px] text-gray-600 font-bold uppercase tracking-widest font-mono">
                                             ID: {user.user_id.slice(-6)}
                                          </div>
                                       </div>
                                    </div>
                                </div>
                             </td>
                             <td className="py-4 px-6 text-right">
                                <div className="inline-flex items-center justify-end gap-1.5 bg-surface px-3 py-1.5 rounded-lg border border-border group-hover:border-white/10 transition-colors">
                                   <Clock size={14} className="text-emerald-400" />
                                   <span className="font-black text-[#ededed] italic">
                                      {Number(user?.total_hours || 0).toFixed(1)}
                                   </span>
                                   <span className="text-[10px] text-gray-500 font-black uppercase italic">Hours</span>
                                </div>
                             </td>
                          </motion.tr>
                       ))
                    )}
                 </AnimatePresence>
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
