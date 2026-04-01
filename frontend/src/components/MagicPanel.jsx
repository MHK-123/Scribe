import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function MagicPanel({ children, className = '', glowColor = 'rgba(75, 139, 245, 0.1)' }) {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const panelRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <motion.div
      ref={panelRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`magic-panel ${className}`}
      style={{
        '--x': `${mousePos.x}%`,
        '--y': `${mousePos.y}%`,
      }}
    >
      {/* Soft torch glow overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${glowColor} 0%, transparent 60%)`
        }}
      />
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
