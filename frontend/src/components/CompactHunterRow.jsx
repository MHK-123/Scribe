import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Swords } from 'lucide-react';
import { getHunterRank } from '../utils/hunterUtils';

export default function CompactHunterRow({ user, index }) {
  const rankInfo = getHunterRank(user?.level || 0, user?.rank || index + 1);
  const isTopThree = (user?.rank || index + 1) <= 3;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-white/10 transition-all gap-4"
    >
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {/* Rank Number */}
        <div className="w-8 shrink-0 flex justify-center">
            {isTopThree ? (
                <div className="relative">
                    <Trophy size={18} className={
                        (user?.rank || index + 1) === 1 ? "text-yellow-400" :
                        (user?.rank || index + 1) === 2 ? "text-slate-300" : "text-orange-500"
                    } />
                    <span className="absolute -bottom-1 -right-1 text-[8px] font-black">{user?.rank || index + 1}</span>
                </div>
            ) : (
                <span className="text-slate-600 font-black italic text-sm">{user?.rank || index + 1}</span>
            )}
        </div>

        {/* Identity Section */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative shrink-0">
            {user?.avatar_url ? (
                <img 
                    src={user.avatar_url} 
                    alt={user.username} 
                    className="w-10 h-10 rounded-xl border border-white/10 shadow-lg group-hover:border-white/20 transition-all"
                />
            ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center font-black text-white/40">
                    {user?.username?.charAt(0) || '?'}
                </div>
            )}
            <div 
                className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a0f]"
                style={{ backgroundColor: rankInfo.color }}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <span 
                className="text-[10px] font-black uppercase tracking-[0.2em] italic mb-0.5"
                style={{ color: rankInfo.color, textShadow: `0 0 10px ${rankInfo.shadow}` }}
            >
                {rankInfo.label}
            </span>
            <span className="text-white font-bold text-sm truncate uppercase tracking-tight">
                {user?.username || 'Unknown Hunter'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex items-center gap-6 shrink-0">
        <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Level</span>
            <div className="flex items-center gap-1.5">
                <Swords size={12} className="text-blue-400" />
                <span className="text-white font-black italic text-sm">{user?.level || 0}</span>
            </div>
        </div>

        <div className="flex flex-col items-end min-w-[80px]">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Harvested</span>
            <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-emerald-400" />
                <div className="flex items-baseline gap-1">
                    <span className="text-[#ededed] font-black italic text-sm">{Number(user?.total_hours || 0).toFixed(1)}</span>
                    <span className="text-[8px] text-slate-600 font-bold uppercase">h</span>
                </div>
            </div>
        </div>
      </div>

      {/* Hover Background Glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${rankInfo.color}, transparent)` }}
      />
    </motion.div>
  );
}
