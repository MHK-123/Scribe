import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Trash2, ShieldCheck, Clock, Shield, Target, Sword, Sparkles } from 'lucide-react';

import MagicPanel from '../components/MagicPanel.jsx';
import DungeonButton from '../components/DungeonButton.jsx';

export default function LevelRewards() {
  const { id } = useParams();
  const { token, apiUrl } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [rewards, setRewards] = useState([]);
  
  const [newReward, setNewReward] = useState({ required_hours: '', role_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, rewardsRes] = await Promise.all([
          axios.get(`${apiUrl}/guilds/${id}/roles`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${apiUrl}/settings/rewards/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        // Filter out @everyone role
        setRoles(rolesRes.data.filter(r => r.name !== '@everyone'));
        setRewards(rewardsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, apiUrl, token]);

  const handleAddReward = async (e) => {
    if (e) e.preventDefault();
    if (!newReward.required_hours || !newReward.role_id) return;
    setSaving(true);
    try {
      const res = await axios.post(`${apiUrl}/settings/rewards/${id}`, newReward, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRewards((prev) => [...prev.filter(r => r.required_hours !== res.data.required_hours), res.data].sort((a,b) => a.required_hours - b.required_hours));
      setNewReward({ required_hours: '', role_id: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rewardId) => {
    try {
      await axios.delete(`${apiUrl}/settings/rewards/${id}/${rewardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRewards(rewards.filter(r => r.id !== rewardId));
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleColor = (colorCode) => {
    if (!colorCode || colorCode === 0) return '#64748b';
    return `#${colorCode.toString(16).padStart(6, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-8 animate-pulse p-4">
        <div className="h-10 bg-white/5 rounded w-1/3 mb-10"></div>
        <div className="h-32 bg-white/5 rounded-2xl mb-6"></div>
        <div className="h-64 bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 p-4">
      {/* Header */}
      <header className="space-y-2">
        <div className="text-[10px] font-bold tracking-[0.3em] text-blue-500/60 uppercase">Sanctum Relics</div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white flex items-center gap-4 uppercase">
           <Award className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={32} />
           Rank Requirements
        </h1>
        <p className="text-slate-400 font-medium max-w-xl">
           Grant ancient roles to hunters who have harvested enough mana through study.
        </p>
      </header>

      {/* Add Reward Panel */}
      <MagicPanel className="p-8 border-white/5" glowColor="rgba(59,130,246,0.05)">
        <h3 className="text-sm font-bold tracking-[0.2em] text-slate-100 uppercase mb-8 flex items-center gap-2">
           <Plus size={16} className="text-blue-400" /> Manifest New Milestone
        </h3>
        
        <form onSubmit={handleAddReward} className="flex flex-col md:flex-row gap-8 items-end">
          <div className="flex-1 w-full space-y-3">
            <label className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase italic">Harvested Hours</label>
            <div className="relative group">
               <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
               <input 
                 type="number" 
                 min="1"
                 placeholder="e.g. 10"
                 value={newReward.required_hours}
                 onChange={e => setNewReward({...newReward, required_hours: e.target.value})}
                 className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white font-bold outline-none focus:border-blue-500/40 transition-all"
               />
            </div>
          </div>
          
          <div className="flex-1 w-full space-y-3">
            <label className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase italic">Awarded Role</label>
            <div className="relative group">
               <select 
                  value={newReward.role_id}
                  onChange={e => setNewReward({...newReward, role_id: e.target.value})}
                  className="w-full appearance-none bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-blue-500/40 transition-all cursor-pointer"
               >
                  <option value="" disabled className="bg-[#0a0a0f]">Select a role...</option>
                  {roles.map(r => (
                     <option key={r.id} value={r.id} className="bg-[#0a0a0f]">
                       {r.name}
                     </option>
                  ))}
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-slate-300 transition-colors">▼</div>
            </div>
          </div>

          <DungeonButton 
            variant="fire"
            onClick={handleAddReward}
            disabled={saving || !newReward.required_hours || !newReward.role_id}
            className="w-full md:w-auto h-14"
          >
            <AnimatePresence mode="wait">
               {saving ? (
                  <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     <span>Forging...</span>
                  </motion.div>
               ) : (
                  <div className="flex items-center gap-2">
                    <Plus size={18} /> 
                    <span>Manifest</span>
                  </div>
               )}
            </AnimatePresence>
          </DungeonButton>
        </form>
      </MagicPanel>

      {/* List Panel */}
      <MagicPanel className="border-white/5 overflow-hidden" glowColor="rgba(59,130,246,0.02)">
        <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
           <h3 className="text-xs font-bold tracking-[0.2em] text-slate-100 uppercase flex items-center gap-3">
             <ShieldCheck size={18} className="text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]" /> Established Milestones
           </h3>
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{rewards.length} Recorded</span>
        </div>
        
        {rewards.length === 0 ? (
           <div className="p-16 text-center">
              <Sword className="w-12 h-12 mx-auto mb-4 text-slate-800 animate-pulse" />
              <p className="text-slate-500 font-medium italic">No rank manifestations found in this realm.</p>
           </div>
        ) : (
           <div className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {rewards.map(reward => {
                   const role = roles.find(r => r.id === reward.role_id);
                   const roleName = role ? role.name : 'Unknown Sigil';
                   const roleHex = role ? getRoleColor(role.color) : '#64748b';

                   return (
                     <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={reward.id} 
                        className="flex items-center justify-between px-8 py-6 hover:bg-white/[0.01] transition-colors group"
                     >
                       <div className="flex items-center gap-8">
                          <div className="relative">
                             <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-[#0a0a0f] border border-white/5 shadow-inner group-hover:border-blue-500/20 transition-colors">
                                <span className="text-2xl font-black text-white">{parseFloat(reward.required_hours)}</span>
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Mana Hours</span>
                             </div>
                             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
                                <Sparkles size={10} className="text-blue-400" />
                             </div>
                          </div>
                          
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic">Granted Sigil</p>
                             <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                                <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: roleHex, color: roleHex }}></div>
                                <span className="font-bold text-sm text-white tracking-wide">{roleName}</span>
                             </div>
                          </div>
                       </div>
                       
                       <DungeonButton 
                         variant="danger"
                         onClick={() => handleDelete(reward.id)} 
                         className="p-3 min-w-0"
                         icon={Trash2}
                         title="Purge Sigil"
                       />
                     </motion.div>
                   )
                })}
              </AnimatePresence>
           </div>
        )}
      </MagicPanel>
    </div>
  );
}
