import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Wand2 } from 'lucide-react';

const ManaSpark = ({ delay }) => (
  <motion.div
    initial={{ scale: 0, opacity: 1, y: 0, x: 0 }}
    animate={{ 
      scale: [0, 1.2, 0], 
      opacity: [1, 1, 0],
      y: [0, -40 - Math.random() * 60],
      x: [0, (Math.random() - 0.5) * 80]
    }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.8, delay, ease: "easeOut" }}
    className="absolute w-1.5 h-1.5 rounded-full"
    style={{ 
      background: Math.random() > 0.5 ? '#3b82f6' : '#a855f7',
      filter: 'blur(1px)',
      boxShadow: '0 0 8px currentColor'
    }}
  />
);

export default function SummonButton({ children, onClick, className = '', href, target }) {
  const [isSummoning, setIsSummoning] = useState(false);

  const handleClick = (e) => {
    setIsSummoning(true);
    setTimeout(() => setIsSummoning(false), 1000);
    if (onClick) onClick(e);
  };

  const content = (
    <>
      <AnimatePresence>
        {isSummoning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
            {[...Array(16)].map((_, i) => (
              <ManaSpark key={i} delay={i * 0.03} />
            ))}
            <motion.div 
              initial={{ scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute w-full h-full bg-blue-500 bg-opacity-30 rounded-full blur-2xl"
            />
          </div>
        )}
      </AnimatePresence>
      
      <span className="relative z-10 flex items-center justify-center gap-2 font-bold tracking-widest text-[#ededed]">
        <Wand2 size={18} className={`transition-transform duration-500 ${isSummoning ? 'rotate-[360deg] scale-125' : ''}`} />
        {children || "SUMMON BOT"}
      </span>

      {/* Neon Glow Border */}
      <div className="absolute inset-0 rounded-xl border border-blue-500/30 group-hover:border-purple-500/60 transition-colors pointer-events-none" />
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 blur-sm pointer-events-none" />
      
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-md rounded-xl pointer-events-none shadow-inner" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <motion.div 
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
          className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
        />
      </div>
    </>
  );

  const sharedProps = {
    whileHover: { scale: 1.05, y: -2 },
    whileTap: { scale: 0.95 },
    onClick: handleClick,
    className: `relative group px-8 py-4 transition-all duration-300 ${className}`
  };

  if (href) {
    return (
      <motion.a 
        {...sharedProps} 
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
    <motion.button {...sharedProps}>
      {content}
    </motion.button>
  );
}
