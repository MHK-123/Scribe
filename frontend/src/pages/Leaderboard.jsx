import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Search } from 'lucide-react';

export default function Leaderboard() {
  const { id } = useParams();
  const { token, apiUrl } = useContext(AuthContext);
  const [filter, setFilter] = useState('monthly');
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${apiUrl}/guilds/${id}/leaderboard?type=${filter}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setLeaders(res.data))
    .catch(console.error)
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
            <h1 className="text-3xl font-bold tracking-tight mb-2">Leaderboard</h1>
            <p className="text-gray-400">See who is dedicating the most time to focused studying.</p>
         </div>
         
         {/* Sleek Tab Toggles */}
         <div className="flex p-1 bg-surface border border-border rounded-xl w-fit">
            {[
              { id: 'monthly', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'all_time', label: 'All Time' }
            ].map(f => (
               <button 
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                    filter === f.id ? 'text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
               >
                  {filter === f.id && (
                     <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white/10 border border-white/20 rounded-lg"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                     />
                  )}
                  <span className="relative z-10">{f.label}</span>
               </button>
            ))}
         </div>
      </div>
      
      <div className="glass-card rounded-2xl overflow-hidden border border-border/60">
        
        {/* Search / Filter Bar area (visual only for now) */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface-hover/20">
           <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search user..." 
                className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-[#ededed] placeholder-gray-500 focus:outline-none focus:border-accent/50 transition-colors"
                disabled
              />
           </div>
           {filter === 'monthly' && (
              <div className="text-sm text-emerald-400 flex items-center gap-1.5 font-medium bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
                 <Trophy size={14} /> Current Race
              </div>
           )}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="border-b border-white/5 text-sm text-gray-400 uppercase tracking-wider bg-surface/30">
                    <th className="py-4 px-6 font-medium w-24 text-center">Rank</th>
                    <th className="py-4 px-6 font-medium">User</th>
                    <th className="py-4 px-6 font-medium text-right">Total Hours</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 <AnimatePresence mode="wait">
                    {loading ? (
                       <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td colSpan="3" className="py-20 text-center">
                             <div className="inline-flex items-center gap-2 text-gray-400">
                                <span className="w-4 h-4 rounded-full border-2 border-accent border-r-transparent animate-spin"></span>
                                Loading statistics...
                             </div>
                          </td>
                       </motion.tr>
                    ) : leaders.length === 0 ? (
                       <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td colSpan="3" className="py-20 text-center text-gray-500">
                             No study sessions recorded for this period.
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
                             className="group hover:bg-surface-hover/50 transition-colors"
                          >
                             <td className="py-4 px-6 text-center">
                                <div className="flex justify-center">
                                   {getRankBadge(user.rank || idx + 1)}
                                </div>
                             </td>
                             <td className="py-4 px-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                                      {user.user_id.slice(-2)}
                                   </div>
                                   <div>
                                      <div className="font-medium text-[#ededed] group-hover:text-white transition-colors">
                                         User {user.user_id}
                                      </div>
                                      {idx < 3 && filter === 'last_month' && (
                                         <div className="text-xs text-yellow-500/80 font-medium mt-0.5">Title Defender</div>
                                      )}
                                   </div>
                                </div>
                             </td>
                             <td className="py-4 px-6 text-right">
                                <div className="inline-flex items-center justify-end gap-1.5 bg-surface px-3 py-1.5 rounded-lg border border-border group-hover:border-white/10 transition-colors">
                                   <Clock size={14} className="text-emerald-400" />
                                   <span className="font-semibold text-[#ededed]">{user.total_hours}</span>
                                   <span className="text-sm text-gray-400">h</span>
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
