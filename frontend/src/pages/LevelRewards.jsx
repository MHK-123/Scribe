import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Trash2, ShieldCheck, Clock } from 'lucide-react';

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
    e.preventDefault();
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
    if (!colorCode || colorCode === 0) return '#ededed';
    return `#${colorCode.toString(16).padStart(6, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-8 animate-pulse">
        <div className="h-10 bg-surface rounded w-1/3 mb-10"></div>
        <div className="glass-card p-8 h-32 rounded-2xl mb-6"></div>
        <div className="glass-card p-8 h-64 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="max-w-4xl space-y-8"
    >
      <div className="mb-10">
         <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Award className="text-accent" />
            Level & Role Rewards
         </h1>
         <p className="text-gray-400 text-lg">
            Automatically assign Discord roles when members hit study hour milestones.
         </p>
      </div>

      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-border/80 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-purple-500 to-emerald-500"></div>
        <h3 className="text-xl font-semibold mb-6 text-[#ededed]">Add New Milestone</h3>
        
        <form onSubmit={handleAddReward} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">Required Study Hours</label>
            <div className="relative">
               <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 type="number" 
                 min="1"
                 placeholder="e.g. 10"
                 value={newReward.required_hours}
                 onChange={e => setNewReward({...newReward, required_hours: e.target.value})}
                 className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-[#ededed] focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all"
               />
            </div>
          </div>
          
          <div className="flex-1 w-full relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">Reward Role</label>
            <select 
               value={newReward.role_id}
               onChange={e => setNewReward({...newReward, role_id: e.target.value})}
               className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[#ededed] focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all appearance-none"
            >
               <option value="" disabled>Select a Discord server role...</option>
               {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
               ))}
            </select>
            <div className="absolute right-4 top-[2.4rem] pointer-events-none text-gray-400">▼</div>
          </div>

          <button 
            type="submit" 
            disabled={saving || !newReward.required_hours || !newReward.role_id}
            className="w-full md:w-auto h-[48px] px-8 bg-accent hover:bg-[#6c78e6] text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-accent/40 disabled:opacity-50 flex flex-shrink-0 items-center justify-center gap-2"
          >
            {saving ? (
               <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : <><Plus size={18} /> Add Reward</>}
          </button>
        </form>
      </div>

      <div className="glass-card rounded-2xl border border-border/80 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 bg-surface/30">
           <h3 className="text-lg font-semibold text-[#ededed] flex items-center gap-2">
             <ShieldCheck size={18} className="text-emerald-400" /> Active Milestones
           </h3>
        </div>
        
        {rewards.length === 0 ? (
           <div className="p-10 text-center text-gray-400">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No role rewards configured yet.</p>
           </div>
        ) : (
           <div className="divide-y divide-white/5">
              <AnimatePresence>
                {rewards.map(reward => {
                   const role = roles.find(r => r.id === reward.role_id);
                   const roleName = role ? role.name : 'Unknown Role';
                   const roleHex = role ? getRoleColor(role.color) : '#ededed';

                   return (
                     <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        key={reward.id} 
                        className="flex items-center justify-between px-6 py-5 hover:bg-surface/30 transition-colors"
                     >
                       <div className="flex items-center gap-6">
                          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-surface border border-border">
                             <span className="text-xl font-bold font-mono text-accent">{parseFloat(reward.required_hours)}</span>
                             <span className="text-[10px] text-gray-500 uppercase tracking-wider">Hours</span>
                          </div>
                          
                          <div>
                             <p className="text-sm text-gray-400 mb-1">Unlocks Role</p>
                             <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border w-max">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: roleHex }}></span>
                                <span className="font-medium text-sm text-[#ededed]">{roleName}</span>
                             </div>
                          </div>
                       </div>
                       
                       <button 
                         onClick={() => handleDelete(reward.id)} 
                         className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                         title="Remove Reward"
                       >
                         <Trash2 size={18} />
                       </button>
                     </motion.div>
                   )
                })}
              </AnimatePresence>
           </div>
        )}
      </div>

    </motion.div>
  );
}
