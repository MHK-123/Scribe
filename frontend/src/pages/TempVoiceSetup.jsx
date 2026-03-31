import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ServerCog, Save, Mic, Settings2, ShieldCheck, ChevronDown, FolderOpen } from 'lucide-react';

// ─── Channel Dropdown ────────────────────────────────────────────────────────
function ChannelSelect({ label, icon, value, onChange, options, placeholder, loading }) {
  return (
    <div>
      <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#8892b0', marginBottom:'0.5rem' }}>
        {icon}{label}
      </label>
      <div style={{ position:'relative' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', background:'rgba(6,6,18,0.9)', border:'1px solid rgba(75,139,245,0.18)', borderRadius:'0.625rem', color:'#8892b0', fontSize:'0.9rem' }}>
            <div className="rune-loader" style={{ width:16, height:16 }}/>
            Loading channels...
          </div>
        ) : (
          <>
            <select value={value} onChange={e => onChange(e.target.value)} className="scribe-select">
              <option value="">{placeholder}</option>
              {options.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select>
            <ChevronDown size={15} style={{ position:'absolute', right:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'#8892b0', pointerEvents:'none' }}/>
          </>
        )}
      </div>
      {value && !loading && (
        <p style={{ marginTop:'0.35rem', fontSize:'0.72rem', color:'rgba(75,139,245,0.5)', fontFamily:'JetBrains Mono, monospace' }}>ID: {value}</p>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TempVoiceSetup() {
  const { id }            = useParams();
  const { token, apiUrl } = useContext(AuthContext);

  const [loading, setLoading]     = useState(true);
  const [chLoading, setChLoading] = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const [channels, setChannels] = useState({ voiceChannels: [], categories: [], textChannels: [] });
  const [config, setConfig]     = useState({
    join_to_create_channel: '',
    temp_vc_category:       '',
    default_user_limit:     0,
    auto_delete_empty:      true,
    vc_name_template:       "{username}'s Dungeon",
  });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${apiUrl}/guilds/${id}/config`,   { headers }),
      axios.get(`${apiUrl}/guilds/${id}/channels`, { headers }),
    ]).then(([configRes, channelRes]) => {
      const d = configRes.data;
      setConfig({
        join_to_create_channel: d.join_to_create_channel || '',
        temp_vc_category:       d.temp_vc_category || '',
        default_user_limit:     d.default_user_limit ?? 0,
        auto_delete_empty:      d.auto_delete_empty ?? true,
        vc_name_template:       d.vc_name_template || "{username}'s Dungeon",
      });
      setChannels(channelRes.data);
      setLoading(false);
      setChLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
      setChLoading(false);
    });
  }, [id, apiUrl, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${apiUrl}/guilds/${id}/config`, config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'40vh', gap:'1rem' }}>
      <div className="rune-loader"/>
      <p style={{ color:'rgba(136,146,176,0.5)', fontSize:'0.8rem', letterSpacing:'0.1em', textTransform:'uppercase' }}>Loading configuration...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }} style={{ maxWidth:'720px' }}>
      {/* Header */}
      <div style={{ marginBottom:'2rem' }}>
        <div className="section-label" style={{ marginBottom:'0.4rem' }}>VC CONFIGURATION</div>
        <h1 style={{ fontSize:'1.75rem', fontWeight:700, letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:'0.75rem', margin:0 }}>
          <ServerCog style={{ color:'#4b8bf5' }}/> Join-To-Create Setup
        </h1>
        <p style={{ color:'#8892b0', marginTop:'0.4rem', fontSize:'0.9rem' }}>Configure how temporary voice channels are spawned.</p>
      </div>

      <form onSubmit={handleSubmit} className="panel" style={{ padding:'2rem', borderRadius:'1rem' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'2rem' }}>

          {/* Channel Routing */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
              <Mic size={15} style={{ color:'#4b8bf5' }}/>
              <span className="section-label">CHANNEL ROUTING</span>
            </div>
            <p style={{ color:'rgba(136,146,176,0.5)', fontSize:'0.8rem', marginBottom:'1.25rem' }}>Select from your server — no IDs required.</p>
            <hr className="neon-divider" style={{ marginBottom:'1.5rem' }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
              <ChannelSelect
                label="Join-To-Create Channel"
                icon={<Mic size={12} style={{ color:'#4b8bf5' }}/>}
                value={config.join_to_create_channel}
                onChange={val => setConfig({ ...config, join_to_create_channel: val })}
                options={channels.voiceChannels}
                placeholder="— Select voice channel —"
                loading={chLoading}
              />
              <ChannelSelect
                label="Target Category"
                icon={<FolderOpen size={12} style={{ color:'#7b5cf0' }}/>}
                value={config.temp_vc_category}
                onChange={val => setConfig({ ...config, temp_vc_category: val })}
                options={channels.categories}
                placeholder="— Select category —"
                loading={chLoading}
              />
            </div>
          </div>

          {/* Room Preferences */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
              <Settings2 size={15} style={{ color:'#00d4ff' }}/>
              <span className="section-label">ROOM PREFERENCES</span>
            </div>
            <hr className="neon-divider" style={{ marginBottom:'1.5rem' }}/>

            <div style={{ marginBottom:'1.25rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#8892b0' }}>VC Name Template</label>
                <span style={{ fontSize:'0.72rem', color:'rgba(0,212,255,0.7)', background:'rgba(0,212,255,0.07)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:'0.375rem', padding:'0.15rem 0.5rem', fontFamily:'JetBrains Mono, monospace' }}>{'{username}'}</span>
              </div>
              <input
                type="text"
                value={config.vc_name_template}
                onChange={e => setConfig({ ...config, vc_name_template: e.target.value })}
                className="scribe-input"
                placeholder="{username}'s Dungeon"
              />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', alignItems:'end' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#8892b0', marginBottom:'0.5rem' }}>Default User Limit</label>
                <div style={{ position:'relative' }}>
                  <input
                    type="number"
                    value={config.default_user_limit}
                    onChange={e => setConfig({ ...config, default_user_limit: parseInt(e.target.value) || 0 })}
                    className="scribe-input"
                    min="0" max="99"
                    style={{ paddingRight:'6rem' }}
                  />
                  <span style={{ position:'absolute', right:'1rem', top:'50%', transform:'translateY(-50%)', color:'rgba(136,146,176,0.5)', fontSize:'0.8rem', pointerEvents:'none' }}>
                    {config.default_user_limit === 0 ? 'Unlimited' : 'Users'}
                  </span>
                </div>
              </div>

              <div
                onClick={() => setConfig({ ...config, auto_delete_empty: !config.auto_delete_empty })}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', background:'rgba(6,6,18,0.9)', border:`1px solid ${config.auto_delete_empty ? 'rgba(75,139,245,0.3)' : 'rgba(75,139,245,0.1)'}`, borderRadius:'0.625rem', cursor:'pointer', userSelect:'none', transition:'all 0.2s ease' }}
              >
                <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#c8d6f0' }}>Auto-delete empty rooms</span>
                <div className={`toggle-track ${config.auto_delete_empty ? 'on' : 'off'}`}>
                  <motion.div
                    style={{ position:'absolute', top:'3px', width:'18px', height:'18px', background:'#fff', borderRadius:'50%', boxShadow:'0 2px 4px rgba(0,0,0,0.4)' }}
                    animate={{ left: config.auto_delete_empty ? '26px' : '3px' }}
                    transition={{ type:'spring', stiffness:500, damping:30 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <hr className="neon-divider" style={{ margin:'2rem 0 1.5rem' }}/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'rgba(136,146,176,0.45)', fontSize:'0.8rem' }}>
            <ShieldCheck size={14} style={{ color:'#4b8bf5' }}/>
            Changes apply immediately to new rooms
          </div>
          <button type="submit" disabled={saving} className="btn-primary" style={{ minWidth:'9.5rem', justifyContent:'center', opacity: saving ? 0.7 : 1 }}>
            {saving ? <><div className="rune-loader" style={{ width:14, height:14 }}/>&nbsp;Saving...</>
             : saved  ? <><ShieldCheck size={15}/>&nbsp;Saved!</>
             : <><Save size={15}/>&nbsp;Save Config</>}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
