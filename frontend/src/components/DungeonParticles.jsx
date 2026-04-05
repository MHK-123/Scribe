import React from 'react';
import { motion } from 'framer-motion';

const Ember = ({ delay, x, size, duration }) => (
  <motion.div
    initial={{ y: '110vh', x, opacity: 0 }}
    animate={{ 
      y: '-10vh', 
      x: x + (Math.random() - 0.5) * 100,
      opacity: [0, 0.4, 0.4, 0],
    }}
    transition={{ 
      duration, 
      delay, 
      repeat: Infinity, 
      ease: "linear" 
    }}
    className="fixed rounded-full pointer-events-none"
    style={{ 
      width: size, 
      height: size, 
      backgroundColor: '#ff9d1c',
      filter: 'blur(1px)',
      boxShadow: '0 0 10px #ff9d1c'
    }}
  />
);

export default function DungeonParticles() {
  const embers = [...Array(15)].map((_, i) => ({
    id: i,
    delay: Math.random() * 8,
    x: `${Math.random() * 100}vw`,
    size: 1 + Math.random() * 3,
    duration: 10 + Math.random() * 10
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Stone wall base texture layer */}
      <div className="dungeon-walls" />
      
      {/* Fog/Mist layer */}
      <div className="fog-layer" />
      
      {/* Ambient torch-like overlays */}
      <div className="dungeon-overlay" />

      {/* Floating embers */}
      {embers.map((ember) => (
        <Ember key={ember.id} {...ember} />
      ))}
      
      {/* Top vignetting to add depth */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40" />
    </div>
  );
}
