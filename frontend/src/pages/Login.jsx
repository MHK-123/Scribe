import React, { useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Scribe logo SVG — inline so it works without asset pipeline
const ScribeLogo = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="quill" x1="10" y1="10" x2="46" y2="46" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4b8bf5"/>
        <stop offset="1" stopColor="#7b5cf0"/>
      </linearGradient>
      <radialGradient id="glow-tip" cx="50%" cy="50%" r="50%">
        <stop stopColor="#00d4ff" stopOpacity="0.8"/>
        <stop offset="1" stopColor="#4b8bf5" stopOpacity="0"/>
      </radialGradient>
    </defs>
    {/* Glow base */}
    <circle cx="28" cy="28" r="18" fill="url(#glow-tip)" opacity="0.15"/>
    {/* Quill shaft */}
    <path d="M14 42 L38 10" stroke="url(#quill)" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)"/>
    {/* Feather vanes */}
    <path d="M38 10 C44 8, 46 16, 38 22" stroke="#4b8bf5" strokeWidth="1.5" fill="rgba(75,139,245,0.08)" filter="url(#glow)"/>
    <path d="M38 10 C42 14, 40 20, 34 24" stroke="#7b5cf0" strokeWidth="1.2" fill="none" opacity="0.7" filter="url(#glow)"/>
    {/* Nib glow point */}
    <circle cx="14" cy="42" r="2.5" fill="#00d4ff" filter="url(#glow)"/>
    <circle cx="14" cy="42" r="1" fill="#fff"/>
    {/* Rune marks (sigil lines) */}
    <path d="M20 36 L26 32" stroke="#4b8bf5" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    <path d="M22 40 L30 36" stroke="#7b5cf0" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

// Floating ambient orbs
const AmbientOrbs = () => (
  <div className="dungeon-bg" aria-hidden="true">
    <div style={{
      position:'absolute', top:'15%', left:'10%',
      width:'400px', height:'400px',
      background:'radial-gradient(ellipse, rgba(75,139,245,0.09) 0%, transparent 70%)',
      borderRadius:'50%', animation:'float 10s ease-in-out infinite'
    }}/>
    <div style={{
      position:'absolute', bottom:'10%', right:'8%',
      width:'350px', height:'350px',
      background:'radial-gradient(ellipse, rgba(123,92,240,0.07) 0%, transparent 70%)',
      borderRadius:'50%', animation:'float 14s ease-in-out infinite reverse'
    }}/>
    <div style={{
      position:'absolute', top:'50%', right:'25%',
      width:'200px', height:'200px',
      background:'radial-gradient(ellipse, rgba(0,212,255,0.05) 0%, transparent 70%)',
      borderRadius:'50%', animation:'float 8s ease-in-out infinite',
      animationDelay:'2s'
    }}/>
  </div>
);

export default function Login() {
  const { user, apiUrl } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/servers');
  }, [user, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{background:'#020209'}}>
      <div className="scanlines" aria-hidden="true"/>
      <AmbientOrbs />

      {/* Horizontal glow line */}
      <div style={{
        position:'absolute', top:'50%', left:'0', right:'0',
        height:'1px',
        background:'linear-gradient(90deg, transparent, rgba(75,139,245,0.12), rgba(123,92,240,0.12), transparent)',
        pointerEvents:'none'
      }}/>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="glass-card p-10 text-center" style={{
          background:'rgba(6,6,20,0.85)',
          border:'1px solid rgba(75,139,245,0.18)',
          borderRadius:'1.25rem',
          boxShadow:'0 0 60px rgba(75,139,245,0.08), 0 32px 64px rgba(0,0,0,0.7)',
        }}>
          {/* Top accent bar */}
          <div style={{
            position:'absolute', top:0, left:'15%', right:'15%', height:'1px',
            background:'linear-gradient(90deg, transparent, rgba(75,139,245,0.7), rgba(123,92,240,0.7), transparent)',
            borderRadius:'999px'
          }}/>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center mb-6"
          >
            <div style={{
              padding:'1rem',
              background:'rgba(75,139,245,0.07)',
              border:'1px solid rgba(75,139,245,0.2)',
              borderRadius:'1rem',
              boxShadow:'0 0 24px rgba(75,139,245,0.15)',
            }}>
              <ScribeLogo size={52}/>
            </div>
          </motion.div>

          {/* Brand name */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="section-label mb-2" style={{color:'rgba(75,139,245,0.6)'}}>SYSTEM INTERFACE</div>
            <h1 style={{
              fontSize:'2.25rem',
              fontWeight:700,
              letterSpacing:'0.12em',
              textTransform:'uppercase',
              background:'linear-gradient(135deg, #e2e8f0 0%, #4b8bf5 50%, #7b5cf0 100%)',
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
              backgroundClip:'text',
              marginBottom:'0.5rem',
            }}>
              SCRIBE
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{color:'#8892b0', fontSize:'0.9rem', lineHeight:1.7, marginBottom:'2rem'}}
          >
            The intelligent voice & study management system.<br/>
            Authenticate to access the control panel.
          </motion.p>

          {/* Divider */}
          <hr className="neon-divider" style={{marginBottom:'2rem'}}/>

          {/* Login Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <a
              href={`${apiUrl}/auth/login`}
              style={{
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:'0.75rem',
                width:'100%',
                padding:'0.9rem 1.5rem',
                background:'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)',
                color:'#fff',
                fontFamily:'Rajdhani, sans-serif',
                fontWeight:700,
                fontSize:'1rem',
                letterSpacing:'0.08em',
                textTransform:'uppercase',
                borderRadius:'0.625rem',
                border:'none',
                cursor:'pointer',
                textDecoration:'none',
                boxShadow:'0 0 24px rgba(88,101,242,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                transition:'all 0.25s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(88,101,242,0.5), inset 0 1px 0 rgba(255,255,255,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 24px rgba(88,101,242,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
              }}
            >
              {/* Discord icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
              </svg>
              Authenticate via Discord
            </a>
          </motion.div>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{marginTop:'1.5rem', color:'rgba(136,146,176,0.45)', fontSize:'0.75rem', letterSpacing:'0.04em'}}
          >
            SCRIBE v2.0 · REQUIRES MANAGE SERVER PERMISSION
          </motion.p>

          {/* Bottom accent bar */}
          <div style={{
            position:'absolute', bottom:0, left:'20%', right:'20%', height:'1px',
            background:'linear-gradient(90deg, transparent, rgba(123,92,240,0.4), transparent)',
          }}/>
        </div>
      </motion.div>
    </div>
  );
}
