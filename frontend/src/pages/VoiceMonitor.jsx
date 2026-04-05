import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Users, Trash2, Mic, Settings2 } from 'lucide-react';
import { io } from 'socket.io-client';

export default function VoiceMonitor() {
  const { id } = useParams();
  const { token, apiUrl } = useContext(AuthContext);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setChannels([]); // Clear old state
    fetchChannels();
    
    // Setup Socket.IO
    const socket = io(apiUrl);
    socket.emit('join_guild_room', id);
    
    socket.on('vc_created', fetchChannels);
    socket.on('vc_deleted', fetchChannels);

    return () => socket.disconnect();
  }, [id, apiUrl, token]);

  const fetchChannels = () => {
    axios.get(`${apiUrl}/guilds/${id}/voice-channels`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setChannels(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end">
         <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Voice Monitor</h1>
            <p className="text-gray-400">Live view of active temporary study rooms.</p>
         </div>
         <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-gray-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span>Live Sync</span>
         </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3].map(i => (
             <div key={i} className="glass-card h-48 animate-pulse p-6"></div>
           ))}
        </div>
      ) : channels.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 glass border-dashed rounded-2xl min-h-[400px]">
           <div className="w-16 h-16 bg-surface rounded-2xl mb-6 flex items-center justify-center border border-border">
              <Mic className="w-8 h-8 text-gray-500" />
           </div>
           <h3 className="text-xl font-semibold mb-2 text-[#ededed]">No Active Rooms</h3>
           <p className="text-gray-400 text-center max-w-sm">
             There are currently no temporary voice channels active in this server. Rooms will appear here automatically when created.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <AnimatePresence>
             {channels.map((channel, idx) => (
                <motion.div 
                   key={channel.channel_id}
                   initial={{ opacity: 0, scale: 0.95, y: 10 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95, y: -10 }}
                   transition={{ duration: 0.3, delay: idx * 0.05 }}
                   className="glass-card flex flex-col overflow-hidden group border-border/60 hover:border-accent/30"
                >
                   {/* Top Header */}
                   <div className="p-5 border-b border-border/50 flex justify-between items-start bg-surface-hover/30">
                      <div className="flex items-center gap-3 relative z-10">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
                            {channel.owner_id.toString().substring(0, 1) || "U"}
                         </div>
                         <div>
                            <h3 className="font-semibold text-[#ededed] leading-tight truncate max-w-[150px]">Room {channel.channel_id.substring(channel.channel_id.length - 4)}</h3>
                            <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
                               <Users size={12} /> Active Now
                            </p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                         <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <Settings2 size={16} />
                         </button>
                      </div>
                   </div>
                   
                   {/* Stats Area (Placeholder for actual memebers in future) */}
                   <div className="p-5 flex-1 flex flex-col justify-center">
                      <div className="text-sm text-gray-400 mb-1">Owner ID</div>
                      <code className="text-xs bg-black/40 px-2 py-1 rounded text-gray-300 font-mono break-all border border-white/5">
                         {channel.owner_id}
                      </code>
                   </div>

                   {/* Action Buttons */}
                   <div className="p-4 bg-black/20 mt-auto flex items-center gap-2">
                      <button className="flex-1 py-2 px-3 bg-surface hover:bg-surface-hover border border-border hover:border-white/20 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors text-[#ededed]">
                         <Lock size={14} className="text-gray-400"/> Lock
                      </button>
                      <button className="flex-1 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors text-red-400">
                         <Trash2 size={14} /> Delete
                      </button>
                   </div>
                </motion.div>
             ))}
           </AnimatePresence>
        </div>
      )}
    </div>
  );
}
