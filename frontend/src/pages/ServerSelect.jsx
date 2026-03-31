import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Settings, Plus, Server, LogOut } from 'lucide-react';

export default function ServerSelect() {
  const { token, apiUrl, user, logout } = useContext(AuthContext);
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    axios.get(`${apiUrl}/guilds`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setGuilds(res.data);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      if (err.response?.status === 401) {
         logout();
      }
      setLoading(false);
    });
  }, [apiUrl, token, logout]);

  return (
    <div style={{ minHeight:'100vh', background:'#020209', color:'#e2e8f0', position:'relative' }}>
       <div className="dungeon-bg" aria-hidden="true"/>
       
       {/* Navbar */}
       <header style={{
          position:'sticky', top:0, zIndex:50,
          background:'rgba(2,2,9,0.88)', backdropFilter:'blur(20px)',
          borderBottom:'1px solid rgba(75,139,245,0.12)',
          padding:'0 1.5rem', height:'60px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          boxShadow:'0 1px 0 rgba(75,139,245,0.06)',
       }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
             <div style={{ padding:'0.4rem', background:'rgba(75,139,245,0.1)', border:'1px solid rgba(75,139,245,0.2)', borderRadius:'0.5rem' }}>
                <Server style={{ width:18, height:18, color:'#4b8bf5' }}/>
             </div>
             <span style={{ fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', fontSize:'1rem' }}>SCRIBE</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
             <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(8,8,24,0.8)', border:'1px solid rgba(75,139,245,0.14)', padding:'0.3rem 0.75rem 0.3rem 0.4rem', borderRadius:'999px' }}>
                <img src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : `https://ui-avatars.com/api/?name=${user.username}&background=4b8bf5&color=fff`} alt="Avatar" style={{ width:28, height:28, borderRadius:'50%', border:'1px solid rgba(75,139,245,0.3)' }}/>
                <span style={{ fontSize:'0.875rem', fontWeight:600, color:'#c8d6f0' }}>{user.username}</span>
             </div>
             <button onClick={logout} style={{ padding:'0.4rem', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:'0.5rem', color:'#f87171', cursor:'pointer', display:'flex', alignItems:'center' }}>
                <LogOut size={17}/>
             </button>
          </div>
       </header>

       <main style={{ maxWidth:'1280px', margin:'0 auto', padding:'3.5rem 1.5rem 5rem', position:'relative', zIndex:1 }}>
          <div style={{ marginBottom:'3rem' }}>
            <div className="section-label" style={{ marginBottom:'0.5rem' }}>SERVER SELECTION</div>
            <motion.h1
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              style={{ fontSize:'2rem', fontWeight:700, letterSpacing:'0.06em', marginBottom:'0.5rem' }}
            >
              Choose Your <span className="gradient-text">Domain</span>
            </motion.h1>
            <motion.p
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              style={{ color:'#8892b0', fontSize:'0.95rem' }}
            >
              Select a server where you hold command permissions.
            </motion.p>
          </div>
          
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="glass-card h-48 animate-pulse p-6 flex flex-col justify-between">
                     <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-xl bg-white/5"></div>
                        <div className="space-y-3 flex-1">
                          <div className="h-4 bg-white/5 rounded w-3/4"></div>
                          <div className="h-3 bg-white/5 rounded w-1/2"></div>
                        </div>
                     </div>
                     <div className="h-10 bg-white/5 rounded-lg w-full mt-6"></div>
                  </div>
                ))}
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               <AnimatePresence>
                 {guilds.map((guild, index) => (
                    <motion.div 
                       key={guild.id}
                       initial={{ opacity: 0, scale: 0.95, y: 20 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       transition={{ delay: index * 0.05, duration: 0.4, type: "spring" }}
                       className="h-full"
                    >
                        <div className="glass-card" style={{ height:'100%', padding:'1.5rem', display:'flex', flexDirection:'column', position:'relative' }}>
                           {/* Status badge */}
                           <div style={{ position:'absolute', top:'1rem', right:'1rem' }}>
                             {guild.is_installed
                               ? <span className="badge-active"><span style={{ width:6, height:6, borderRadius:'50%', background:'#00d4ff', display:'inline-block', animation:'glow-pulse 2s infinite' }}/> Online</span>
                               : <span className="badge-inactive"><span style={{ width:6, height:6, borderRadius:'50%', background:'#8892b0', display:'inline-block' }}/> Offline</span>
                             }
                           </div>

                           <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.25rem' }}>
                              {guild.icon_url
                                ? <img src={guild.icon_url} alt={guild.name} style={{ width:52, height:52, borderRadius:'0.75rem', border:'1px solid rgba(75,139,245,0.2)' }}/>
                                : <div style={{ width:52, height:52, borderRadius:'0.75rem', background:'linear-gradient(135deg, rgba(75,139,245,0.15), rgba(123,92,240,0.15))', border:'1px solid rgba(75,139,245,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', fontWeight:700, color:'#4b8bf5' }}>{guild.name.charAt(0)}</div>
                              }
                              <div style={{ flex:1, overflow:'hidden' }}>
                                 <h2 style={{ fontWeight:700, fontSize:'1rem', letterSpacing:'0.03em', color:'#e2e8f0', marginBottom:'0.25rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{guild.name}</h2>
                                 <p style={{ fontSize:'0.78rem', color:'#8892b0', letterSpacing:'0.04em', textTransform:'uppercase' }}>Management Access</p>
                              </div>
                           </div>

                           <hr className="neon-divider" style={{ marginBottom:'1.25rem' }}/>

                           <div style={{ marginTop:'auto' }}>
                              {guild.is_installed ? (
                                 <Link to={`/dashboard/${guild.id}`} className="btn-ghost" style={{ width:'100%', justifyContent:'center', textDecoration:'none' }}>
                                   <Settings size={15}/> Manage
                                 </Link>
                              ) : (
                                 <a href={`https://discord.com/api/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID || '1415398482029711470'}&permissions=8&scope=bot`} target="_blank" rel="noreferrer" className="btn-primary" style={{ width:'100%', justifyContent:'center', textDecoration:'none' }}>
                                   <Plus size={15}/> Install Bot
                                 </a>
                              )}
                           </div>
                        </div>
                    </motion.div>
                 ))}
               </AnimatePresence>
               
               {!loading && guilds.length === 0 && (
                 <div className="col-span-full py-20 text-center glass border-dashed">
                    <p className="text-gray-400 text-lg">No servers found where you have Manage Guild permissions.</p>
                 </div>
               )}
            </div>
          )}
       </main>
    </div>
  );
}
