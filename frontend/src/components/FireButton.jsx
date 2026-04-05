import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FireSpark = ({ delay }) => (
  <motion.div
    initial={{ scale: 0, opacity: 1, y: 0, x: 0 }}
    animate={{ 
      scale: [0, 1.5, 0], 
      opacity: [1, 1, 0],
      y: [0, -30 - Math.random() * 50],
      x: [0, (Math.random() - 0.5) * 60]
    }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className="absolute w-2 h-2 rounded-full"
    style={{ 
      background: Math.random() > 0.3 ? '#ff9d1c' : '#ff5f1f',
      filter: 'blur(1px)'
    }}
  />
);

export default function FireButton({ children, onClick, className = '', variant = 'primary' }) {
  const [isFiring, setIsFiring] = useState(false);

  const handleClick = (e) => {
    setIsFiring(true);
    setTimeout(() => setIsFiring(false), 800);
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`rune-btn group ${className} ${variant === 'ghost' ? 'bg-transparent border-opacity-30' : ''}`}
    >
      <AnimatePresence>
        {isFiring && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
            {[...Array(12)].map((_, i) => (
              <FireSpark key={i} delay={i * 0.02} />
            ))}
            <motion.div 
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute w-full h-full bg-orange-500 bg-opacity-20 rounded-full blur-xl"
            />
          </div>
        )}
      </AnimatePresence>
      
      <span className="relative z-10 flex items-center gap-2 group-active:scale-95 transition-transform">
        {children}
      </span>
      
      {/* Subtle hover ember glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-orange-500/10 to-transparent pointer-events-none" />
    </motion.button>
  );
}
