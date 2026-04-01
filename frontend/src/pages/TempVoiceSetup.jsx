import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ServerCog, Save, Mic, Settings2, ShieldCheck, ChevronDown, FolderOpen, Sword, Skull } from 'lucide-react';

import MagicPanel from '../components/MagicPanel.jsx';
import DungeonButton from '../components/DungeonButton.jsx';

// ─── Channel Dropdown ────────────────────────────────────────────────────────
function ChannelSelect({ label, icon, value, onChange, options, placeholder, loading }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
        {icon}{label}
      </label>
      <div className="relative">
        {loading ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-slate-500 text-sm italic">
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            Scrying channels...
          </div>
        ) : (
          <div className="relative group">
            <select 
              value={value} 
              onChange={e => onChange(e.target.value)} 
              className="w-full appearance-none bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-slate-200 font-semibold focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all cursor-pointer group-hover:border-white/20"
            >
              <option value="" className="bg-[#0a0a0f]">{placeholder}</option>
              {options.map(ch => <option key={ch.id} value={ch.id} className="bg-[#0a0a0f]">{ch.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-slate-300 transition-colors" />
          </div>
        )}
      </div>
      {value && !loading && (
        <p className="mt-1 text-[10px] text-blue-500/40 font-mono tracking-wider">SIGIL ID: {value}</p>
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
    if (e) e.preventDefault();
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
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
      <p className="text-slate-500 text-[10px] font-bold tracking-[0.4em] uppercase animate-pulse">Reading Ancient Configs...</p>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 p-4">
      {/* Header */}
      <header className="space-y-2">
        <div className="text-[10px] font-bold tracking-[0.3em] text-blue-500/60 uppercase">Chamber Rituals</div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white flex items-center gap-4 uppercase">
          <ServerCog className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={32} />
          Spawn Configuration
        </h1>
        <p className="text-slate-400 font-medium max-w-xl">
          Define the geometric parameters for temporary voice dungeons manifested within this realm.
        </p>
      </header>

      <MagicPanel className="p-8 border-white/5 shadow-2xl" glowColor="rgba(59,130,246,0.05)">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Channel Routing */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <Mic className="text-blue-500" size={20} />
              <h3 className="text-sm font-bold tracking-[0.2em] text-slate-100 uppercase">Channel ley-lines</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ChannelSelect
                label="Primary Spawning Node"
                icon={<Mic size={14} className="text-blue-400" />}
                value={config.join_to_create_channel}
                onChange={val => setConfig({ ...config, join_to_create_channel: val })}
                options={channels.voiceChannels}
                placeholder="— Select anchor channel —"
                loading={chLoading}
              />
              <ChannelSelect
                label="Target Void (Category)"
                icon={<FolderOpen size={14} className="text-purple-400" />}
                value={config.temp_vc_category}
                onChange={val => setConfig({ ...config, temp_vc_category: val })}
                options={channels.categories}
                placeholder="— Select ritual space —"
                loading={chLoading}
              />
            </div>
          </section>

          {/* Room Preferences */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <Settings2 className="text-orange-500" size={20} />
              <h3 className="text-sm font-bold tracking-[0.2em] text-slate-100 uppercase">Manifestation Rules</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-orange-500/30 to-transparent" />
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase italic">Naming Sigil Pattern</label>
                  <span className="text-[10px] font-mono text-orange-400 bg-orange-400/5 border border-orange-400/20 rounded px-2 py-0.5">Variable: {'{username}'}</span>
                </div>
                <input
                  type="text"
                  value={config.vc_name_template}
                  onChange={e => setConfig({ ...config, vc_name_template: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold placeholder:text-slate-700 focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all"
                  placeholder="{username}'s Dungeon"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase italic">Inhabitant Limit</label>
                  <div className="relative group">
                    <input
                      type="number"
                      value={config.default_user_limit}
                      onChange={e => setConfig({ ...config, default_user_limit: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold focus:border-blue-500/40 outline-none transition-all pr-24"
                      min="0" max="99"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pointer-events-none group-focus-within:text-blue-400 transition-colors">
                      {config.default_user_limit === 0 ? 'Infinite' : 'Souls'}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setConfig({ ...config, auto_delete_empty: !config.auto_delete_empty })}
                  className={`flex items-center justify-between p-4 bg-black/60 border rounded-xl cursor-pointer transition-all group ${config.auto_delete_empty ? 'border-blue-500/30 bg-blue-500/[0.02]' : 'border-white/5 hover:border-white/10'}`}
                >
                  <div className="space-y-0.5">
                    <span className="block text-sm font-bold text-slate-200">Auto-Purge Empty Rooms</span>
                    <span className="block text-[10px] text-slate-500 font-medium uppercase tracking-tight">Vanish when soul count reaches zero</span>
                  </div>
                  <div className="relative w-12 h-6 flex items-center">
                    <div className={`w-full h-full rounded-full transition-colors ${config.auto_delete_empty ? 'bg-blue-600' : 'bg-slate-800'}`} />
                    <motion.div
                      animate={{ x: config.auto_delete_empty ? 24 : 4 }}
                      className="absolute w-4 h-4 bg-white rounded-full shadow-lg"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Actions */}
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-slate-500 italic text-xs font-medium">
               <ShieldCheck className="text-blue-500" size={16} />
               Spells manifest immediately upon room generation.
            </div>
            
            <DungeonButton 
              variant="fire"
              onClick={handleSubmit}
              className="min-w-[12rem] h-14"
              disabled={saving}
            >
              <AnimatePresence mode="wait">
                {saving ? (
                   <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Incanting...</span>
                   </motion.div>
                ) : saved ? (
                   <motion.div key="saved" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 text-green-400">
                      <Sword size={18} />
                      <span>Sigil Recorded!</span>
                   </motion.div>
                ) : (
                   <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <Save size={18} />
                      <span>Record Sigil</span>
                   </motion.div>
                )}
              </AnimatePresence>
            </DungeonButton>
          </div>
        </form>
      </MagicPanel>

      {/* Decorative Floor Detail */}
      <div className="flex justify-center pt-12 opacity-10">
         <Skull size={48} className="text-slate-500" />
      </div>
    </div>
  );
}
