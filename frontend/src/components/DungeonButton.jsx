import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Wand2, Flame, Shield, ArrowRight } from 'lucide-react';

const DungeonSpark = ({ delay, color }) => (
  <motion.div
    initial={{ scale: 0, opacity: 1, y: 0, x: 0 }}
    animate={{ 
      scale: [0, 1.4, 0], 
      opacity: [1, 1, 0],
      y: [0, -40 - Math.random() * 70],
      x: [0, (Math.random() - 0.5) * 90]
    }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.7, delay, ease: "easeOut" }}
    className="absolute w-2 h-2 rounded-full"
    style={{ 
      background: color,
      filter: 'blur(1.5px)',
      boxShadow: `0 0 10px ${color}`
    }}
  />
);

export default function DungeonButton({ 
  children, 
  onClick, 
  className = '', 
  variant = 'fire', // fire, mana, emerald, danger, ghost
  icon: Icon,
  disabled = false,
  href,
  target,
  type = 'button'
}) {
  const [isActivating, setIsActivating] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'mana':
        return {
          border: 'border-blue-500/30 group-hover:border-blue-500/60',
          glow: 'bg-blue-600/10',
          spark: Math.random() > 0.5 ? '#3b82f6' : '#a855f7',
          text: 'text-blue-400 group-hover:text-blue-200'
        };
      case 'emerald':
        return {
          border: 'border-emerald-500/30 group-hover:border-emerald-500/60',
          glow: 'bg-emerald-600/10',
          spark: Math.random() > 0.5 ? '#10b981' : '#34d399',
          text: 'text-emerald-400 group-hover:text-emerald-200'
        };
      case 'danger':
        return {
          border: 'border-red-500/30 group-hover:border-red-500/60',
          glow: 'bg-red-600/10',
          spark: Math.random() > 0.5 ? '#ef4444' : '#f87171',
          text: 'text-red-400 group-hover:text-red-200'
        };
      case 'ghost':
        return {
          border: 'border-white/10 group-hover:border-white/20',
          glow: 'bg-white/5',
          spark: '#cbd5e1',
          text: 'text-slate-400 group-hover:text-slate-200'
        };
      case 'fire':
      default:
        return {
          border: 'border-orange-500/30 group-hover:border-orange-500/60',
          glow: 'bg-orange-600/10',
          spark: Math.random() > 0.5 ? '#ff9d1c' : '#ff5f1f',
          text: 'text-orange-400 group-hover:text-orange-200'
        };
    }
  };

  const styles = getVariantStyles();

  const handleClick = (e) => {
    if (disabled) return;
    setIsActivating(true);
    setTimeout(() => setIsActivating(false), 900);
    if (onClick) onClick(e);
  };

  const content = (
    <>
      <AnimatePresence>
        {isActivating && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
            {[...Array(14)].map((_, i) => (
              <DungeonSpark key={i} delay={i * 0.02} color={styles.spark} />
            ))}
            <motion.div 
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={`absolute w-full h-full ${styles.glow} rounded-full blur-2xl`}
            />
          </div>
        )}
      </AnimatePresence>
      
      <span className={`relative z-10 flex items-center justify-center gap-2.5 font-black tracking-widest uppercase italic transition-all group-active:scale-95 ${styles.text}`}>
        {Icon && <Icon size={18} className="transition-transform group-hover:rotate-12" />}
        {children}
      </span>

      {/* Decorative Border & Glow */}
      <div className={`absolute inset-0 rounded-xl border transition-all duration-300 ${styles.border} group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]`} />
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-sm rounded-xl transition-colors group-hover:bg-white/[0.05]" />
      
      {/* Inner Shade */}
      <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] pointer-events-none" />

      {/* Shimmer effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <motion.div 
          animate={{ x: ['-200%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
        />
      </div>
    </>
  );

  const motionProps = {
    whileHover: { y: -2, scale: 1.02 },
    whileTap: { scale: 0.97 },
    onClick: handleClick,
    className: `relative group px-6 py-3.5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${className}`
  };

  if (href) {
    return (
      <motion.a 
        {...motionProps} 
        href={href} 
        target={target} 
        rel={target === '_blank' ? "noreferrer" : ""}
        style={{ textDecoration: 'none', display: 'flex' }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button {...motionProps} type={type} disabled={disabled}>
      {content}
    </motion.button>
  );
}
