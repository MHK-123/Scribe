import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer, Plus, Trash2, Save, Mic, Hash,
  ChevronDown, RotateCcw, Zap, Moon, Play, Pause, Circle
} from 'lucide-react';

import MagicPanel from '../components/MagicPanel.jsx';
import DungeonButton from '../components/DungeonButton.jsx';

// ── Helpers ──
const fmtTime = (sec) => {
  const s = Math.max(0, sec);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const phaseColor = (phase) =>
  phase === 'focus'  ? '#4b8bf5' :
  phase === 'break'  ? '#7b5cf0' :
  phase === 'paused' ? '#3a3a5c' : '#2ecc71';

// ── Sub-components ─────────────────────────────────────────────────────────────

function ChannelDropdown({ label, icon, value, onChange, options = [], placeholder, loading }) {
  return (
    <div className="space-y-2 text-left">
      <label className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">
        {icon}
        {label}
      </label>
      <div className="relative group">
        {loading ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-slate-500 text-sm animate-pulse">
            <div className="w-3 h-3 border-2 border-slate-500/30 border-t-slate-500 rounded-full animate-spin" />
            Loading Portal...
          </div>
        ) : (
          <>
            <select
              value={value}
              onChange={e => onChange(e.target.value)}
              className="w-full appearance-none bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all cursor-pointer group-hover:border-white/20 relative z-20"
              style={{ pointerEvents: 'auto' }}
            >
              <option value="" className="bg-[#0b0b14]">{placeholder}</option>
              {options?.map(ch => (
                <option key={ch.id} value={ch.id} className="bg-[#0b0b14]">
                  {ch.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-slate-300 transition-colors z-30">
              <ChevronDown size={16} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NumericStepper({ label, value, onChange, min, max, unit = '', color = '#4b8bf5', hint }) {
  const clamp = (v) => {
    const num = Number(v);
    if (isNaN(num)) return min;
    return Math.min(max, Math.max(min, num));
  };

  return (
    <div className="space-y-2 text-left">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">{label}</label>
        {hint && <span className="text-[9px] text-slate-600 font-medium italic translate-y-[-2px]">{hint}</span>}
      </div>
      <div className="flex items-stretch bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden group hover:border-white/20 transition-all h-[46px]">
        <button
          onClick={() => onChange(clamp(value - 1))}
          className="px-4 flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white transition-all active:scale-90"
        >
          <span className="text-lg font-bold">−</span>
        </button>
        <div className="flex-1 relative flex items-center bg-black/20">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={e => onChange(clamp(e.target.value))}
            className="w-full h-full text-center bg-transparent text-sm font-bold text-slate-100 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <div className="absolute right-2 text-[10px] font-bold text-slate-600 pointer-events-none uppercase tracking-tighter">
            {unit}
          </div>
        </div>
        <button
          onClick={() => onChange(clamp(value + 1))}
          className="px-4 flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white transition-all active:scale-90"
        >
          <span className="text-lg font-bold">+</span>
        </button>
      </div>
    </div>
  );
}

// ── Preset Bar ─────────────────────────────────────────────────────────────────
const PRESETS = [
  { label:'Classic',   sub:'25 / 5',  focus:25, brk:5 },
  { label:'Deep Work', sub:'50 / 10', focus:50, brk:10 },
  { label:'Intense',   sub:'90 / 15', focus:90, brk:15 },
];

function PresetBar({ onSelect }) {
  const [active, setActive] = useState(null);
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Quick Presets</div>
      <div className="grid grid-cols-3 gap-3">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => { setActive(i); onSelect(p); }}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
              active === i 
                ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
            }`}
          >
            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${active === i ? 'text-blue-400' : 'text-slate-200'}`}>
              {p.label}
            </div>
            <div className="text-[10px] font-mono text-slate-500">{p.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 0' }}>
      <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#c8d6f0' }}>{label}</span>
      <div
        className={`toggle-track ${value ? 'on' : 'off'}`}
        onClick={() => onChange(!value)}
        style={{ cursor:'pointer' }}
      >
        <motion.div
          style={{ position:'absolute', top:'3px', width:'18px', height:'18px', background:'#fff', borderRadius:'50%', boxShadow:'0 2px 4px rgba(0,0,0,0.4)' }}
          animate={{ left: value ? '26px' : '3px' }}
          transition={{ type:'spring', stiffness:500, damping:30 }}
        />
      </div>
    </div>
  );
}

// ── Live Session Card ──────────────────────────────────────────────────────────
function LiveSessionCard({ session }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const endTime = session.phase_end_time ? new Date(session.phase_end_time).getTime() : null;
  const remaining = endTime ? Math.max(0, Math.floor((endTime - now) / 1000)) : 0;
  const totalSec  = session.phase === 'focus' ? session.focus_duration * 60 : session.break_duration * 60;
  const progress  = totalSec > 0 ? Math.min(1, (totalSec - remaining) / totalSec) : 0;
  const color     = phaseColor(session.phase);

  // Donut ring
  const R = 44, C = 2 * Math.PI * R;
  const dash = C * (1 - progress);

  return (
    <div className="glass-card" style={{ padding:'1.5rem', borderRadius:'0.875rem', borderColor: `${color}30` }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
        <div>
          <div className="section-label" style={{ marginBottom:'0.2rem' }}>ACTIVE SESSION</div>
          <div style={{ fontSize:'0.8rem', color:'#8892b0' }}>VC: <code style={{ color:'#c8d6f0' }}>{session.voice_channel_id}</code></div>
        </div>
        <span className="badge-active">● LIVE</span>
      </div>

      <div style={{ display:'flex', gap:'2rem', alignItems:'center' }}>
        {/* SVG Donut Timer */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Glow filter */}
            <defs>
              <filter id={`glow-${session.id}`}>
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(75,139,245,0.08)" strokeWidth="8"/>
            {/* Progress */}
            <circle
              cx="50" cy="50" r={R}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={dash}
              transform="rotate(-90 50 50)"
              filter={`url(#glow-${session.id})`}
              style={{ transition:'stroke-dashoffset 1s linear' }}
            />
            {/* Phase icon */}
            <text x="50" y="54" textAnchor="middle" fontSize="10" fill="#8892b0" fontWeight="bold" fontFamily="Inter" className="uppercase tracking-[0.2em]">
              {session.phase}
            </text>
          </svg>
        </div>

        {/* Stats */}
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'2.2rem', fontWeight:700, fontFamily:'JetBrains Mono, monospace', color, letterSpacing:'0.05em', lineHeight:1, marginBottom:'1rem' }}>
            {session.phase === 'paused' ? 'PAUSED' : fmtTime(remaining)}
          </div>
          <div style={{ height:'4px', background:'rgba(255,255,255,0.03)', borderRadius:'99px', overflow:'hidden' }}>
            <motion.div style={{ height:'100%', background:color, boxShadow:`0 0 12px ${color}44`, borderRadius:'99px' }}
              animate={{ width:`${(Number(progress) * 100).toFixed(1)}%` }} transition={{ duration:1 }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Config Form Card ───────────────────────────────────────────────────────────
function ConfigCard({ config, channels, chLoading, onSave, onDelete, isNew = false }) {
  const [form, setForm] = useState({
    voice_channel_id: config?.voice_channel_id || '',
    text_channel_id:  config?.text_channel_id  || '',
    focus_duration:   config?.focus_duration   || 50,
    break_duration:   config?.break_duration   || 10,
    auto_start:       config?.auto_start       ?? true,
    auto_stop:        config?.auto_stop        ?? true,
  });

  // Sync internal state when config prop changes (Crucial for persistence sanity)
  useEffect(() => {
    if (config) {
      setForm({
        voice_channel_id: config.voice_channel_id || '',
        text_channel_id:  config.text_channel_id  || '',
        focus_duration:   config.focus_duration   || 50,
        break_duration:   config.break_duration   || 10,
        auto_start:       config.auto_start       ?? true,
        auto_stop:        config.auto_stop        ?? true,
      });
    }
  }, [config]);

  const [saving, setSaving]   = useState(false);
  const [expanded, setExpanded] = useState(isNew);

  const handleSave = async () => {
    if (!form.voice_channel_id || !form.text_channel_id) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="glass-card" style={{ padding:'1.5rem', borderRadius:'0.875rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }} onClick={() => !isNew && setExpanded(e => !e)}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ width:36, height:36, borderRadius:'0.5rem', background:'rgba(75,139,245,0.1)', border:'1px solid rgba(75,139,245,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Timer size={16} style={{ color:'#4b8bf5' }}/>
          </div>
          <div>
            {isNew
              ? <div style={{ fontWeight:700, color:'#4b8bf5', fontSize:'0.95rem' }}>Start New Session</div>
              : <div style={{ fontWeight:700, color:'#e2e8f0', fontSize:'0.95rem' }}>Active Configuration</div>
            }
            {!isNew && (
              <div style={{ fontSize:'0.75rem', color:'#8892b0', fontFamily:'JetBrains Mono, monospace' }}>
                {form.focus_duration}m focus · {form.break_duration}m break
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <DungeonButton 
              variant="danger"
              onClick={e => { e.stopPropagation(); onDelete(config.id); }}
              className="p-2 min-w-0"
              icon={Trash2}
            />
          )}
          {!isNew && <ChevronDown size={16} style={{ color:'#8892b0', transform: expanded ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>}
        </div>
      </div>

      <AnimatePresence>
        {(expanded || isNew) && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} style={{ overflow:'hidden' }}>
            <hr className="neon-divider" style={{ margin:'1.25rem 0' }}/>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
              <ChannelDropdown label="Voice Channel" icon={<Mic size={12} style={{ color:'#4b8bf5' }}/>}
                value={form.voice_channel_id} onChange={v => setForm(f => ({...f, voice_channel_id:v}))}
                options={channels.voiceChannels || []} placeholder="— Select VC —" loading={chLoading}/>
              <ChannelDropdown label="Text Channel" icon={<Hash size={12} style={{ color:'#00d4ff' }}/>}
                value={form.text_channel_id} onChange={v => setForm(f => ({...f, text_channel_id:v}))}
                options={channels.textChannels || []} placeholder="— Select channel —" loading={chLoading}/>
            </div>

            {/* Presets */}
            <PresetBar onSelect={p => setForm(f => ({ ...f, focus_duration: p.focus, break_duration: p.brk }))}/>

            {/* Steppers */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'0.5rem' }}>
              <NumericStepper
                label="Focus Duration" unit="min" color="#4b8bf5"
                value={form.focus_duration} min={5} max={180}
                hint="5 – 180 min"
                onChange={v => setForm(f => ({...f, focus_duration: v}))}
              />
              <NumericStepper
                label="Break Duration" unit="min" color="#7b5cf0"
                value={form.break_duration} min={1} max={60}
                hint="1 – 60 min"
                onChange={v => setForm(f => ({...f, break_duration: v}))}
              />
            </div>
            <div className="text-[10px] text-slate-600 font-medium italic mb-4">
              Recommended: 25 / 5 for standard focus · 50 / 10 for deep work
            </div>

            <hr className="neon-divider" style={{ margin:'0.75rem 0' }}/>
            <Toggle label="Auto-start when member joins" value={form.auto_start} onChange={v => setForm(f => ({...f, auto_start:v}))}/>
            <Toggle label="Auto-stop when VC empties"   value={form.auto_stop}  onChange={v => setForm(f => ({...f, auto_stop:v}))}/>

            <hr className="neon-divider" style={{ margin:'1rem 0 1.25rem' }}/>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem' }}>
              {!isNew && (
                <DungeonButton variant="ghost" onClick={() => setExpanded(false)} className="text-sm">
                  Cancel
                </DungeonButton>
              )}
              <DungeonButton 
                variant="fire"
                onClick={handleSave} 
                disabled={saving || !form.voice_channel_id || !form.text_channel_id} 
                className="text-sm"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save size={16}/>
                    <span>Save Config</span>
                  </div>
                )}
              </DungeonButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Pomodoro() {
  const { id }            = useParams();
  const { token, apiUrl } = useContext(AuthContext);

  const [configs,   setConfigs]   = useState([]);
  const [sessions,  setSessions]  = useState([]);
  const [channels,  setChannels]  = useState({ voiceChannels:[], textChannels:[], categories:[] });
  const [chLoading, setChLoading] = useState(true);
  const [loading,   setLoading]   = useState(true);
  const [showNew,   setShowNew]   = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const loadData = useCallback(async () => {
    // Strictly clear all component state caches on server switch to prevent phantom data leaks
    setLoading(true);
    setChLoading(true);
    setConfigs([]);
    setSessions([]);
    setChannels({ voiceChannels:[], textChannels:[], categories:[] });

    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Fetch Configs and Sessions independently of Channels
      const fetchData = async () => {
        try {
          const cfgRes = await axios.get(`${apiUrl}/pomodoro/${id}/configs`, { headers });
          setConfigs(cfgRes.data || []);
        } catch (e) {
          console.error("Failed to load configs:", e);
        }
      };

      const fetchSessions = async () => {
        try {
          const sessRes = await axios.get(`${apiUrl}/pomodoro/${id}/sessions`, { headers });
          setSessions(sessRes.data || []);
        } catch (e) {
          console.error("Failed to load sessions:", e);
        }
      };

      const fetchChannels = async () => {
        try {
          const chRes = await axios.get(`${apiUrl}/guilds/${id}/channels`, { headers });
          setChannels(chRes.data);
        } catch (e) {
          console.error("Failed to load channels:", e);
        }
      };

      await Promise.allSettled([fetchData(), fetchSessions(), fetchChannels()]);
    } finally {
      setLoading(false);
      setChLoading(false);
    }
  }, [id, apiUrl, token]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      axios.get(`${apiUrl}/pomodoro/${id}/sessions`, { headers })
        .then(r => setSessions(r.data)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSave = async (form) => {
    const headers = { Authorization: `Bearer ${token}` };
    await axios.post(`${apiUrl}/pomodoro/${id}/config`, form, { headers });
    setShowNew(false);
    await loadData();
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleDelete = async (cfgId) => {
    if (!confirm('Remove this configuration?')) return;
    const headers = { Authorization: `Bearer ${token}` };
    await axios.delete(`${apiUrl}/pomodoro/${id}/config/${cfgId}`, { headers });
    await loadData();
  };

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'50vh', gap:'1rem' }}>
      <div className="rune-loader"/>
      <p style={{ color:'rgba(136,146,176,0.5)', fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase' }}>Loading Pomodoro System...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }} style={{ maxWidth:'800px' }}>

      {/* Header */}
      <div style={{ marginBottom:'2.5rem' }}>
        <div className="section-label" style={{ marginBottom:'0.4rem' }}>FOCUS ENGINE</div>
        <h1 style={{ fontSize:'1.75rem', fontWeight:700, letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:'0.75rem', margin:0 }}>
           Pomodoro Controller
        </h1>
        <p style={{ color:'#8892b0', marginTop:'0.4rem', fontSize:'0.9rem' }}>
          Configure high-performance focus timers that activate when members join voice channels.
        </p>
      </div>

      {/* Live Sessions */}
      {sessions.length > 0 && (
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="section-label" style={{ color:'#4b8bf5' }}>LIVE SESSIONS</span>
          </div>
          <div style={{ display:'grid', gap:'1rem' }}>
            {sessions.map(s => <LiveSessionCard key={s.id} session={s}/>)}
          </div>
          <div className="h-px bg-white/5 my-8 w-full" />
        </div>
      )}

      {/* Configurations */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Zap size={14} style={{ color:'#4b8bf5' }}/>
            <span className="section-label">CONFIGURED CHANNELS</span>
          </div>
          <DungeonButton variant="mana" onClick={() => setShowNew(true)} className="px-4 py-2 text-xs" icon={Plus}>
            Add Channel
          </DungeonButton>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <AnimatePresence>
            {showNew && (
              <motion.div key="new" initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
                <ConfigCard isNew config={null} channels={channels} chLoading={chLoading}
                  onSave={handleSave} onDelete={() => setShowNew(false)}/>
              </motion.div>
            )}
          </AnimatePresence>

          {configs.length === 0 && !showNew && (
            <div style={{ padding:'3rem', textAlign:'center', background:'rgba(6,6,18,0.5)', border:'1px dashed rgba(75,139,245,0.15)', borderRadius:'0.875rem' }}>
              <Timer size={32} style={{ color:'rgba(75,139,245,0.3)', marginBottom:'0.75rem' }}/>
              <p style={{ color:'#8892b0', fontSize:'0.9rem', marginBottom:'1.5rem' }}>No Pomodoro channels configured yet.</p>
              <DungeonButton variant="fire" onClick={() => setShowNew(true)} icon={Plus}>
                Configure First Channel
              </DungeonButton>
            </div>
          )}

            {configs.map(cfg => {
              const headers = { Authorization: `Bearer ${token}` };
              return (
                <motion.div key={cfg.id} initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  <ConfigCard config={cfg} channels={channels} chLoading={chLoading}
                    onSave={async (form) => {
                      await axios.post(`${apiUrl}/pomodoro/${id}/config`, { ...form, id: cfg.id }, { headers });
                      await loadData();
                      setShowSaved(true);
                      setTimeout(() => setShowSaved(false), 3000);
                    }}
                    onDelete={handleDelete}
                  />
                </motion.div>
              );
            })}
        </div>
      </div>

      {/* Info panel */}
      <div style={{ marginTop:'2rem', padding:'1rem 1.25rem', background:'rgba(75,139,245,0.04)', border:'1px solid rgba(75,139,245,0.12)', borderRadius:'0.75rem', display:'flex', gap:'0.75rem', fontSize:'0.82rem', color:'#8892b0', lineHeight:1.6 }}>
        <Zap size={16} style={{ color:'#4b8bf5', flexShrink:0, marginTop:'2px' }}/>
        <div>
          <strong style={{ color:'#c8d6f0' }}>How it works:</strong> When a hunter joins the configured Voice Channel, Scribe automatically posts a live dungeon panel in the linked Text Channel. The timer counts down, updates every 30 seconds, and transitions between Focus and Break phases automatically. Use the buttons in Discord to pause, skip, or stop the session.
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSaved && (
          <motion.div 
            initial={{ opacity:0, y:20 }} 
            animate={{ opacity:1, y:0 }} 
            exit={{ opacity:0, y:10 }}
            style={{ 
              position:'fixed', bottom:'2rem', left:'50%', x:'-50%',
              background:'linear-gradient(135deg, #4b8bf5, #7b5cf0)', color:'white',
              padding:'1rem 2rem', borderRadius:'99px', display:'flex', alignItems:'center', gap:'1rem',
              boxShadow:'0 10px 40px rgba(75,139,245,0.4)', zIndex:1000,
              fontSize:'0.9rem', fontWeight:800, letterSpacing:'0.05em', textTransform:'uppercase',
              whiteSpace: 'nowrap'
            }}
          >
            <Zap size={18} className="animate-pulse"/>
            <span>Settings Manifested Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
