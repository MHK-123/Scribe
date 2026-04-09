import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Settings, Plus, Server, LogOut, Shield, Zap, Wand2, ArrowRight, ShieldAlert } from 'lucide-react';

import MagicPanel from '../components/MagicPanel.jsx';
import DungeonButton from '../components/DungeonButton.jsx';

export default function ServerSelect() {
  const { token, api, user, logout, isRateLimited, retryAfter } = useContext(AuthContext);
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSummoning, setIsSummoning] = useState(false);
  const [error, setError] = useState(null);

  const fetchGuilds = async (force = false) => {
    // Prevent double-triggering for the same mode
    if (force && refreshing) return;
    if (!force && loading) return;
    
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get(`/guilds${force ? '?force=true' : ''}`);
      setGuilds(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error('🔮 [SENTINEL]: Realm sync failed:', err);
      if (err.response?.status === 401) logout();
      
      const errorMsg = err.response?.data?.error || err.message || "Connection to sanctuary lost.";
      if (err.response?.status !== 429) {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token && !isRateLimited) fetchGuilds();
  }, [token, isRateLimited]);

  // --- Real-time Manifestation Sync (Hardened Polling) ---
  useEffect(() => {
    let pollInterval;
    if (isSummoning && !isRateLimited) {
      // Slowed down to 12s to be conservative with Discord's IP rate limits
      pollInterval = setInterval(() => {
        fetchGuilds(true); 
      }, 12000);
      
      setTimeout(() => {
        setIsSummoning(false);
        clearInterval(pollInterval);
      }, 60000);
    }
    return () => clearInterval(pollInterval);
  }, [isSummoning, isRateLimited]);

  const handleSummon = (guildId) => {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || '1488552752333455481';
    const link = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${guildId}&disable_guild_select=true`;
    
    // Open in a popup for seamless experience
    window.open(link, 'Summon Bot', 'width=500,height=800');
    setIsSummoning(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#020209] text-[#e2e8f0] relative overflow-x-hidden">
      <div className="scanlines" aria-hidden="true"/>
      
      {/* Navbar Runes */}
      <nav className="sticky top-0 z-50 px-6 h-16 flex items-center justify-between bg-[#020209]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.15)]">
               <Server className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-black tracking-[0.2em] text-white uppercase italic">Scribe Archive</span>
         </div>
         
         <div className="flex items-center gap-6">
            {/* Admin Sanctum Link */}
            {String(user?.id).trim() === '1407010812081475757' && (
               <Link to="/admin" className="no-underline">
                 <DungeonButton 
                   variant="danger" 
                   className="h-10 px-5 text-[10px] gap-2.5 group"
                   icon={ShieldAlert}
                 >
                   Core Sanctum
                 </DungeonButton>
               </Link>
            )}

            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-2xl">
               <img 
                 src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : `https://ui-avatars.com/api/?name=${user?.username}&background=3b82f6&color=fff`} 
                 alt="Avatar" 
                 className="w-7 h-7 rounded-full border border-white/10"
               />
               <span className="text-xs font-bold text-slate-300 tracking-wide">{user?.username}</span>
            </div>
            <button 
              onClick={logout} 
              className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all"
              title="Leave Realm"
            >
               <LogOut size={20}/>
            </button>
         </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
         <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="w-max px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">
                 Domain Selection
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                 Choose Your <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">Realm</span>
              </h1>
              <p className="text-slate-500 font-medium max-w-xl text-lg leading-relaxed">
                 Select a sanctuary where your spirit holds the authority to summon and command the Scribe.
              </p>
            </div>

            <DungeonButton
               variant="mana"
               className={`h-12 px-6 text-[10px] gap-2.5 transition-all ${refreshing ? 'opacity-50 pointer-events-none' : ''}`}
               onClick={() => fetchGuilds(true)}
               icon={Zap}
            >
               {refreshing ? 'SYNCHRONIZING...' : 'REFRESH REALMS'}
            </DungeonButton>
         </header>
         
         {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
               ))}
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               <AnimatePresence>
                 {guilds.map((guild, index) => (
                    <motion.div 
                       key={guild.id}
                       initial={{ opacity: 0, y: 30 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.05, duration: 0.5 }}
                       className="group"
                    >
                        <MagicPanel 
                           className="h-full p-8 flex flex-col border-white/5 transition-transform duration-500 group-hover:-translate-y-2"
                           glowColor={guild.is_installed ? "rgba(59,130,246,0.05)" : "rgba(100,116,139,0.02)"}
                        >
                           {/* Presence Stat */}
                           <div className="absolute top-6 right-6">
                             {guild.is_installed
                               ? <span className="flex items-center gap-2 text-[10px] font-black text-blue-500 tracking-widest uppercase italic">
                                   <Zap size={10} className="animate-pulse" /> Manifested
                                 </span>
                               : <span className="text-[10px] font-black text-slate-700 tracking-widest uppercase italic">Untethered</span>
                             }
                           </div>

                           <div className="flex items-center gap-6 mb-8">
                              <div className="relative">
                                 {guild.icon_url
                                   ? <img src={guild.icon_url} alt={guild.name} className="w-16 h-16 rounded-2xl border border-white/10 shadow-2xl group-hover:border-blue-500/40 transition-colors" />
                                   : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center text-2xl font-black text-blue-500 group-hover:border-blue-500/40 transition-colors uppercase italic shadow-inner">{guild.name.charAt(0)}</div>
                                 }
                                 {guild.is_installed && (
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center border border-black shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                                       <Shield size={12} className="text-white fill-white" />
                                    </div>
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h2 className="font-black text-xl text-white tracking-tight leading-tight truncate group-hover:text-blue-400 transition-colors italic uppercase">{guild.name}</h2>
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic">Access Verified</p>
                              </div>
                           </div>

                           <div className="mt-auto space-y-4">
                              {guild.is_installed ? (
                                 <Link to={`/dashboard/${guild.id}`} className="no-underline group/btn">
                                    <DungeonButton 
                                       variant="fire" 
                                       className="w-full h-14"
                                       icon={Settings}
                                    >
                                       Enter Realm
                                    </DungeonButton>
                                 </Link>
                              ) : (
                                  <DungeonButton 
                                     variant={isSummoning ? "mana" : "mana"}
                                     onClick={() => handleSummon(guild.id)}
                                     className="w-full h-14"
                                  >
                                     {isSummoning ? "DETECTING SENTINEL..." : "SUMMON BOT"}
                                  </DungeonButton>
                               )}
                           </div>
                        </MagicPanel>
                    </motion.div>
                 ))}
               </AnimatePresence>
                              {!loading && (error || isRateLimited) && (
                   <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-red-500/5 border border-red-500/10 rounded-3xl space-y-6">
                     <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-2">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                     </div>
                     <div className="space-y-2 px-6">
                       <h3 className="text-xl font-bold uppercase tracking-tight text-white">
                         {isRateLimited ? "HIGH FLUX DETECTED. DISCORD PORTAL IS TEMPORARILY LOCKED (RATE LIMIT)." : error}
                       </h3>
                       <p className="text-slate-500 text-sm max-w-lg mx-auto">
                         {isRateLimited 
                           ? `The portal to Discord is unstable or blocked by High Flux. Please wait approximately ${retryAfter} seconds for the Scribe ignition to recover.`
                           : "The portal to Discord is unstable or blocked by High Flux. Determine if the Scribe ignition has triggered a rate limit."}
                       </p>
                     </div>
                     {!isRateLimited && (
                       <DungeonButton variant="danger" onClick={() => fetchGuilds(true)} className="h-10 px-6 text-[10px]">
                         Retry Synchronizing
                       </DungeonButton>
                     )}
                   </div>
                 )}
                
                {!loading && !error && guilds.length === 0 && (
                  <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
                     <p className="text-slate-500 font-bold italic uppercase tracking-widest">No realms found in this dimension.</p>
                  </div>
                )}
            </div>
         )}
      </main>
    </div>
  );
}
