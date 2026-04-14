import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Search, Swords } from 'lucide-react';
import { getHunterRank } from '../utils/hunterUtils';
import CompactHunterRow from '../components/CompactHunterRow.jsx';

export default function Leaderboard() {
  const { id } = useParams();
  const { token, apiUrl } = useContext(AuthContext);
  const [filter, setFilter] = useState('monthly');
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    setLoading(true);
    setLeaders([]); 
    axios.get(`${apiUrl}/guilds/${id}/leaderboard?type=${filter}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setLeaders(Array.isArray(res.data) ? res.data : []);
    })
    .catch(err => {
      console.error(err);
      setLeaders([]);
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

        {/* Competitive Atmosphere Bar */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] relative z-10">
           <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Seek a specific hunter..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-[#ededed] placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all italic"
                disabled
              />
           </div>
           
           <div className="flex items-center gap-3">
              <div className="text-[10px] text-blue-400 flex items-center gap-1.5 font-black uppercase tracking-widest bg-blue-400/10 px-3 py-1.5 rounded-lg border border-blue-400/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                 <Swords size={14} className="animate-pulse" /> Live Competition
              </div>
           </div>
        </div>

        {/* Hunter List View */}
        <div className="p-4 relative z-10 min-h-[400px]">
           <AnimatePresence mode="wait">
              {loading ? (
                 <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Scrying ancient scrolls...</p>
                 </motion.div>
              ) : leaders.length > 0 ? (
                 <div className="space-y-3">
                    {leaders.map((user, idx) => (
                       <CompactHunterRow 
                          key={user?.user_id || idx} 
                          user={user} 
                          index={idx} 
                       />
                    ))}
                 </div>
              ) : (
                 <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center space-y-4 opacity-40">
                    <div className="p-5 bg-white/5 rounded-full border border-white/10">
                        <Trophy size={48} className="text-slate-600" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-white font-black uppercase tracking-widest italic">No activity yet</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">The scrolls are currently blank in this era.</p>
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
