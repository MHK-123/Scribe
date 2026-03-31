import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer, Plus, Trash2, Save, Mic, Hash,
  ChevronDown, RotateCcw, Zap, Moon, Play, Pause, Circle
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtTime = (sec) => {
  const s = Math.max(0, sec);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const phaseColor = (phase) =>
  phase === 'focus'  ? '#4b8bf5' :
  phase === 'break'  ? '#7b5cf0' :
  phase === 'paused' ? '#3a3a5c' : '#2ecc71';

// ── Sub-components ─────────────────────────────────────────────────────────────

function ChannelDropdown({ label, icon, value, onChange, options, placeholder, loading }) {
  return (
    <div>
      <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#8892b0', marginBottom:'0.4rem' }}>
        {icon}{label}
      </label>
      <div style={{ position:'relative' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.7rem 1rem', background:'rgba(6,6,18,0.9)', border:'1px solid rgba(75,139,245,0.18)', borderRadius:'0.625rem', color:'#8892b0', fontSize:'0.85rem' }}>
            <div className="rune-loader" style={{ width:14, height:14 }}/>
            Loading...
          </div>
        ) : (
          <>
            <select value={value} onChange={e => onChange(e.target.value)} className="scribe-select" style={{ fontSize:'0.9rem' }}>
              <option value="">{placeholder}</option>
              {options.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select>
            <ChevronDown size={14} style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'#8892b0', pointerEvents:'none' }}/>
          </>
        )}
      </div>
    </div>
  );
}

// ── Numeric Stepper ────────────────────────────────────────────────────────────
function NumericStepper({ label, value, onChange, min, max, unit = '', color = '#4b8bf5', hint }) {
  const clamp = (v) => Math.min(max, Math.max(min, Number(v) || min));

  const stepperBtnStyle = (side) => ({
    width: 32, height: 32,
    background: 'rgba(75,139,245,0.08)',
    border: `1px solid rgba(75,139,245,0.18)`,
    borderRadius: side === 'left' ? '0.45rem 0 0 0.45rem' : '0 0.45rem 0.45rem 0',
    color: '#8892b0',
    fontSize: '1.1rem', fontWeight: 700, lineHeight: 1,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
    userSelect: 'none',
  });

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'0.45rem' }}>
        <label style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#8892b0' }}>{label}</label>
        {hint && <span style={{ fontSize:'0.68rem', color:'rgba(136,146,176,0.55)', fontStyle:'italic' }}>{hint}</span>}
      </div>
      <div style={{ display:'flex', alignItems:'stretch', height:34 }}>
        <button
          style={stepperBtnStyle('left')}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(75,139,245,0.18)'; e.currentTarget.style.color=color; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(75,139,245,0.08)'; e.currentTarget.style.color='#8892b0'; }}
          onClick={() => onChange(clamp(value - 1))}
        >−</button>
        <div style={{ position:'relative', flex:1 }}>
          <input
            type="number" min={min} max={max} value={value}
            onChange={e => onChange(clamp(e.target.value))}
            style={{
              width:'100%', height:'100%', textAlign:'center',
              background:'rgba(6,6,18,0.85)',
              border:`1px solid rgba(75,139,245,0.18)`,
              borderLeft:'none', borderRight:'none',
              color, fontFamily:'JetBrains Mono, monospace',
              fontSize:'0.95rem', fontWeight:700,
              outline:'none', boxSizing:'border-box',
              MozAppearance:'textfield',
            }}
          />
        </div>
        <div style={{
          display:'flex', alignItems:'center', paddingRight:'0.5rem',
          background:'rgba(6,6,18,0.85)',
          border:`1px solid rgba(75,139,245,0.18)`,
          borderLeft:'none', borderRight:'none',
          color:'rgba(136,146,176,0.6)', fontSize:'0.75rem', whiteSpace:'nowrap',
        }}>{unit}</div>
        <button
          style={stepperBtnStyle('right')}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(75,139,245,0.18)'; e.currentTarget.style.color=color; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(75,139,245,0.08)'; e.currentTarget.style.color='#8892b0'; }}
          onClick={() => onChange(clamp(value + 1))}
        >+</button>
      </div>
    </div>
  );
}

// ── Preset Bar ─────────────────────────────────────────────────────────────────
const PRESETS = [
  { label:'⚡ Classic',   sub:'25 / 5',  focus:25, brk:5,  cycles:4 },
  { label:'🧠 Deep Work', sub:'50 / 10', focus:50, brk:10, cycles:4 },
  { label:'🔥 Intense',   sub:'90 / 15', focus:90, brk:15, cycles:3 },
];

function PresetBar({ onSelect }) {
  const [active, setActive] = useState(null);
  return (
    <div>
      <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#8892b0', marginBottom:'0.55rem' }}>Quick Presets</div>
      <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap' }}>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => { setActive(i); onSelect(p); }}
            style={{
              flex:1, minWidth:90, padding:'0.55rem 0.75rem',
              background: active===i ? 'rgba(75,139,245,0.18)' : 'rgba(75,139,245,0.05)',
              border: active===i ? '1px solid rgba(75,139,245,0.55)' : '1px solid rgba(75,139,245,0.15)',
              borderRadius:'0.55rem', cursor:'pointer', textAlign:'center',
              transition:'all 0.15s',
              boxShadow: active===i ? '0 0 10px rgba(75,139,245,0.2)' : 'none',
            }}
            onMouseEnter={e => { if(active!==i){ e.currentTarget.style.border='1px solid rgba(75,139,245,0.35)'; e.currentTarget.style.background='rgba(75,139,245,0.1)'; }}}
            onMouseLeave={e => { if(active!==i){ e.currentTarget.style.border='1px solid rgba(75,139,245,0.15)'; e.currentTarget.style.background='rgba(75,139,245,0.05)'; }}}
          >
            <div style={{ fontSize:'0.8rem', fontWeight:700, color: active===i ? '#4b8bf5' : '#c8d6f0', marginBottom:'0.1rem' }}>{p.label}</div>
            <div style={{ fontSize:'0.68rem', color:'#8892b0', fontFamily:'JetBrains Mono, monospace' }}>{p.sub}</div>
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
            <text x="50" y="46" textAnchor="middle" fontSize="18" fill={color}>
              {session.phase === 'focus' ? '⚔' : session.phase === 'break' ? '🌙' : '⏸'}
            </text>
            <text x="50" y="62" textAnchor="middle" fontSize="9" fill="#8892b0" fontFamily="JetBrains Mono">
              {session.phase.toUpperCase()}
            </text>
          </svg>
        </div>

        {/* Stats */}
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'2.2rem', fontWeight:700, fontFamily:'JetBrains Mono, monospace', color, letterSpacing:'0.05em', lineHeight:1, marginBottom:'0.5rem' }}>
            {session.phase === 'paused' ? 'PAUSED' : fmtTime(remaining)}
          </div>
          <div style={{ fontSize:'0.8rem', color:'#8892b0', marginBottom:'0.75rem' }}>
            Cycle <strong style={{ color:'#c8d6f0' }}>{session.current_cycle}</strong> of <strong style={{ color:'#c8d6f0' }}>{session.total_cycles || '∞'}</strong>
          </div>
          <div style={{ height:'3px', background:'rgba(75,139,245,0.08)', borderRadius:'99px', overflow:'hidden' }}>
            <motion.div style={{ height:'100%', background:`linear-gradient(90deg, ${color}, ${color}cc)`, boxShadow:`0 0 8px ${color}88`, borderRadius:'99px' }}
              animate={{ width:`${(progress * 100).toFixed(1)}%` }} transition={{ duration:1 }}/>
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
    cycles:           config?.cycles           || 4,
    auto_start:       config?.auto_start       ?? true,
    auto_stop:        config?.auto_stop        ?? true,
  });
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
              ? <div style={{ fontWeight:700, color:'#4b8bf5', fontSize:'0.95rem' }}>New Pomodoro Channel</div>
              : <div style={{ fontWeight:700, color:'#e2e8f0', fontSize:'0.95rem' }}>Session Config #{config.id}</div>
            }
            {!isNew && (
              <div style={{ fontSize:'0.75rem', color:'#8892b0', fontFamily:'JetBrains Mono, monospace' }}>
                {form.focus_duration}m focus · {form.break_duration}m break · {form.cycles || '∞'} cycles
              </div>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {!isNew && (
            <button onClick={e => { e.stopPropagation(); onDelete(config.id); }}
              style={{ padding:'0.35rem', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:'0.4rem', color:'#f87171', cursor:'pointer', display:'flex' }}>
              <Trash2 size={14}/>
            </button>
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
            <PresetBar onSelect={p => setForm(f => ({ ...f, focus_duration: p.focus, break_duration: p.brk, cycles: p.cycles }))}/>

            {/* Steppers */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.875rem', marginBottom:'0.25rem' }}>
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
              <NumericStepper
                label="Cycles" unit={form.cycles === 0 ? '∞' : ''} color="#00d4ff"
                value={form.cycles} min={0} max={10}
                hint="0 = infinite"
                onChange={v => setForm(f => ({...f, cycles: v}))}
              />
            </div>
            <div style={{ fontSize:'0.72rem', color:'rgba(136,146,176,0.5)', fontStyle:'italic', marginBottom:'0.5rem' }}>
              💡 Recommended: 25 / 5 for consistency · 50 / 10 for deep work
            </div>

            <hr className="neon-divider" style={{ margin:'0.75rem 0' }}/>
            <Toggle label="Auto-start when member joins" value={form.auto_start} onChange={v => setForm(f => ({...f, auto_start:v}))}/>
            <Toggle label="Auto-stop when VC empties"   value={form.auto_stop}  onChange={v => setForm(f => ({...f, auto_stop:v}))}/>

            <hr className="neon-divider" style={{ margin:'1rem 0 1.25rem' }}/>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem' }}>
              {!isNew && <button onClick={() => setExpanded(false)} className="btn-ghost" style={{ fontSize:'0.85rem' }}>Cancel</button>}
              <button onClick={handleSave} disabled={saving || !form.voice_channel_id || !form.text_channel_id} className="btn-primary" style={{ fontSize:'0.85rem', opacity: saving ? 0.7 : 1 }}>
                {saving ? <><div className="rune-loader" style={{ width:14, height:14 }}/>&nbsp;Saving...</> : <><Save size={14}/>&nbsp;Save Config</>}
              </button>
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

  const headers = { Authorization: `Bearer ${token}` };

  const loadData = useCallback(async () => {
    try {
      const [cfgRes, sessRes, chRes] = await Promise.all([
        axios.get(`${apiUrl}/pomodoro/${id}/configs`,  { headers }),
        axios.get(`${apiUrl}/pomodoro/${id}/sessions`, { headers }),
        axios.get(`${apiUrl}/guilds/${id}/channels`,   { headers }),
      ]);
      setConfigs(cfgRes.data);
      setSessions(sessRes.data);
      setChannels(chRes.data);
    } catch (e) {
      console.error(e);
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
    await axios.post(`${apiUrl}/pomodoro/${id}/config`, form, { headers });
    setShowNew(false);
    await loadData();
  };

  const handleDelete = async (cfgId) => {
    if (!confirm('Remove this Pomodoro config?')) return;
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
          <Timer style={{ color:'#4b8bf5' }}/> Pomodoro System
        </h1>
        <p style={{ color:'#8892b0', marginTop:'0.4rem', fontSize:'0.9rem' }}>
          Configure dungeon-themed study timers that activate when hunters join voice channels.
        </p>
      </div>

      {/* Live Sessions */}
      {sessions.length > 0 && (
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
            <Circle size={10} style={{ color:'#00d4ff', fill:'#00d4ff' }}/>
            <span className="section-label" style={{ color:'#00d4ff' }}>LIVE SESSIONS</span>
          </div>
          <div style={{ display:'grid', gap:'0.875rem' }}>
            {sessions.map(s => <LiveSessionCard key={s.id} session={s}/>)}
          </div>
          <hr className="neon-divider" style={{ margin:'2rem 0' }}/>
        </div>
      )}

      {/* Configurations */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Zap size={14} style={{ color:'#4b8bf5' }}/>
            <span className="section-label">CONFIGURED CHANNELS</span>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-ghost" style={{ fontSize:'0.8rem', padding:'0.45rem 0.875rem' }}>
            <Plus size={14}/> Add Channel
          </button>
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
              <p style={{ color:'#8892b0', fontSize:'0.9rem' }}>No Pomodoro channels configured yet.</p>
              <button onClick={() => setShowNew(true)} className="btn-primary" style={{ marginTop:'1rem', fontSize:'0.85rem' }}>
                <Plus size={14}/> Configure First Channel
              </button>
            </div>
          )}

          {configs.map(cfg => (
            <motion.div key={cfg.id} initial={{ opacity:0 }} animate={{ opacity:1 }}>
              <ConfigCard config={cfg} channels={channels} chLoading={chLoading}
                onSave={async (form) => {
                  await axios.post(`${apiUrl}/pomodoro/${id}/config`, { ...form, id: cfg.id }, { headers });
                  await loadData();
                }}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info panel */}
      <div style={{ marginTop:'2rem', padding:'1rem 1.25rem', background:'rgba(75,139,245,0.04)', border:'1px solid rgba(75,139,245,0.12)', borderRadius:'0.75rem', display:'flex', gap:'0.75rem', fontSize:'0.82rem', color:'#8892b0', lineHeight:1.6 }}>
        <Zap size={16} style={{ color:'#4b8bf5', flexShrink:0, marginTop:'2px' }}/>
        <div>
          <strong style={{ color:'#c8d6f0' }}>How it works:</strong> When a hunter joins the configured Voice Channel, Scribe automatically posts a live dungeon panel in the linked Text Channel. The timer counts down, updates every 30 seconds, and transitions between Focus and Break phases automatically. Use the buttons in Discord to pause, skip, or stop the session.
        </div>
      </div>
    </motion.div>
  );
}
