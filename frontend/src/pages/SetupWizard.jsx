import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Mic, Timer, Heart, Zap, Shield, Plus, ArrowRight, ArrowLeft, 
  CheckCircle2, AlertCircle, Save, FolderOpen, Hash, RefreshCw, Wand2, Link
} from 'lucide-react';
import MagicPanel from '../components/MagicPanel.jsx';
import DungeonButton from '../components/DungeonButton.jsx';

const STEPS = [
  { id: 1, title: "Identity", icon: <Server size={18}/> },
  { id: 2, title: "Manifest", icon: <Shield size={18}/> },
  { id: 3, title: "Ley-Lines", icon: <Mic size={18}/> },
  { id: 4, title: "Focus", icon: <Timer size={18}/> },
  { id: 5, title: "Rewards", icon: <Award size={18}/> },
  { id: 6, title: "Protocols", icon: <CheckCircle2 size={18}/> }
];

export default function SetupWizard({ embedded = false }) {
  const { token, apiUrl, api, logout, user } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [channels, setChannels] = useState({ voiceChannels: [], categories: [], textChannels: [] });
  const [roles, setRoles] = useState([]);
  const [chLoading, setChLoading] = useState(false);
  
  // Unified State for Config
  const [config, setConfig] = useState({
    join_to_create_channel: '',
    temp_vc_category: '',
    vc_name_template: "{username}'s Chamber",
    auto_delete_empty: true,
    default_user_limit: 0,
    bot_command_channel_id: '',
    announcement_channel_id: '',
    top1_role_id: '',
    top2_role_id: '',
    top3_role_id: '',
    top10_role_id: '',
  });

  const [pomoConfig, setPomoConfig] = useState({
    voice_channel_id: '',
    text_channel_id: '',
    focus_duration: 50,
    break_duration: 10,
    enabled: true
  });

  const [rewards, setRewards] = useState([]);
  const [isSummoning, setIsSummoning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ─── EFFECTS ───────────────────────────────────────────────────────────────
  
  const fetchGuilds = async (force = false) => {
    if (force) setLoading(true);
    try {
      const res = await api.get(`/guilds${force ? '?force=true' : ''}`);
      setGuilds(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (force) setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 1) {
      fetchGuilds(true);
    }
  }, [currentStep]);

  // Polling for bot installation
  useEffect(() => {
    let pollInterval;
    if (isSummoning && currentStep === 1) {
      pollInterval = setInterval(() => {
        fetchGuilds(); 
      }, 10000); // 10s polling
      
      setTimeout(() => setIsSummoning(false), 60000); // Stop after 1m
    }
    return () => clearInterval(pollInterval);
  }, [isSummoning, currentStep]);

  // Fetch all metadata when guild selected
  useEffect(() => {
    if (selectedGuild) {
      setChLoading(true);
      
      const fetchData = async () => {
        try {
          const [chanRes, configRes, pomoRes, rolesRes, rewardsRes] = await Promise.all([
            api.get(`/guilds/${selectedGuild.id}/channels`),
            api.get(`/guilds/${selectedGuild.id}/config`),
            api.get(`/pomodoro/${selectedGuild.id}/configs`),
            api.get(`/guilds/${selectedGuild.id}/roles`),
            api.get(`/settings/rewards/${selectedGuild.id}`)
          ]);

          setChannels(chanRes.data);
          setRoles(rolesRes.data.filter(r => !r.managed && r.name !== '@everyone'));
          setRewards(rewardsRes.data);

          if (configRes.data && configRes.data.guild_id) {
            setConfig({
              ...config,
              ...configRes.data
            });
          }

          if (pomoRes.data && pomoRes.data.length > 0) {
            setPomoConfig({
              ...pomoConfig,
              ...pomoRes.data[0],
              enabled: true
            });
          }
        } catch (err) {
          console.error(err);
          setError("Failed to synchronize with realm data.");
        } finally {
          setChLoading(false);
        }
      };

      fetchData();
    }
  }, [selectedGuild, token]);

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  
  const nextStep = () => setCurrentStep(prev => Math.min(7, prev + 1));
  const prevStep = () => setCurrentStep(prev => Math.max(1, prev - 1));

  const handleSaveConfig = async (next = true) => {
    setSaving(true);
    try {
      await api.post(`/guilds/${selectedGuild.id}/config`, config);
      if (next) nextStep();
    } catch (err) {
      console.error(err);
      setError("Protocols failed to   // ─── RENDERERS ──────────────────────────────────────────────────────────────
  
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Identify Your Domain</h2>
        <p className="text-slate-500 text-sm italic">The Scribe requires a manifested sanctuary where its spirit holds authority.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {guilds.map(guild => (
            <button
              key={guild.id}
              onClick={() => {
                if (guild.is_installed) {
                  setSelectedGuild(guild);
                  nextStep();
                } else {
                  handleSummon(guild.id);
                }
              }}
              className={`group relative flex items-center gap-4 p-5 rounded-2xl border transition-all ${
                guild.is_installed 
                  ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50' 
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="relative">
                {guild.icon_url 
                  ? <img src={guild.icon_url} alt="" className="w-12 h-12 rounded-xl" />
                  : <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 italic uppercase">{guild.name.charAt(0)}</div>
                }
                {guild.is_installed && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded flex items-center justify-center border border-black shadow-[0_0_8px_rgba(59,130,246,0.5)]"><Shield size={10} className="text-white fill-white"/></div>}
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-slate-100 group-hover:text-white transition-colors uppercase italic truncate max-w-[120px]">{guild.name}</div>
                <div className="text-[10px] font-black tracking-widest text-slate-600 uppercase italic">
                  {guild.is_installed ? 'MANIFESTED' : 'UNTETHERED'}
                </div>
              </div>
              {guild.is_installed ? <ArrowRight size={16} className="text-blue-500" /> : <Plus size={16} className="text-slate-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Realm Manifest</h2>
        <p className="text-slate-500 text-sm italic">Define the geometric parameters for your sanctuary.</p>
      </div>

      <MagicPanel className="p-8 border-white/5" glowColor="rgba(59,130,246,0.05)">
        <div className="space-y-8">
          <div className="space-y-4">
             <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">
               <Wand2 size={14} className="text-blue-400" /> Naming Sigil Pattern
             </label>
             <input 
               type="text"
               value={config.vc_name_template}
               onChange={e => setConfig({...config, vc_name_template: e.target.value})}
               placeholder="{username}'s Chamber"
               className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-blue-500/40"
             />
             <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest italic">Variables: {'{username}, {count}'}</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
            <div className="space-y-1">
              <div className="text-xs font-black uppercase tracking-widest text-white italic">Auto-Purge Empty Rooms</div>
              <div className="text-[10px] text-slate-500 italic">Vanish chambers when soul count reaches zero</div>
            </div>
            <button 
              onClick={() => setConfig({...config, auto_delete_empty: !config.auto_delete_empty})}
              className={`w-12 h-6 rounded-full transition-all relative ${config.auto_delete_empty ? 'bg-blue-600' : 'bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.auto_delete_empty ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"><ArrowLeft size={16}/> Back</button>
            <DungeonButton variant="mana" icon={Save} onClick={() => handleSaveConfig()} disabled={saving}>
              {saving ? 'RECORDING SIGIL...' : 'SAVE & CONTINUE'}
            </DungeonButton>
          </div>
        </div>
      </MagicPanel>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Voice Ley-Lines</h2>
        <p className="text-slate-500 text-sm italic">Set the anchor points for automated voice dungeon manifestation.</p>
      </div>

      <MagicPanel className="p-8 border-white/5" glowColor="rgba(59,130,246,0.05)">
        <div className="space-y-8">
          <div className="space-y-4">
             <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">
               <Mic size={14} className="text-blue-400" /> Primary Spawning Node (Anchor)
             </label>
             <select 
               value={config.join_to_create_channel}
               onChange={e => setConfig({...config, join_to_create_channel: e.target.value})}
               className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-blue-500/40"
             >
               <option value="">— Select Anchor VC —</option>
               {channels.voiceChannels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
             </select>
          </div>

          <div className="space-y-4">
             <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">
               <FolderOpen size={14} className="text-purple-400" /> Target Void (Category)
             </label>
             <select 
               value={config.temp_vc_category}
               onChange={e => setConfig({...config, temp_vc_category: e.target.value})}
               className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-blue-500/40"
             >
               <option value="">— Select Category —</option>
               {channels.categories.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
             </select>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"><ArrowLeft size={16}/> Back </button>
            <DungeonButton variant="mana" icon={Save} onClick={() => handleSaveConfig()} disabled={saving || !config.join_to_create_channel || !config.temp_vc_category}>
              NEXT INFRASTRUCTURE
            </DungeonButton>
          </div>
        </div>
      </MagicPanel>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Focus Engine</h2>
        <p className="text-slate-500 text-sm italic">Configure reactive focus timers for your sanctuary.</p>
      </div>

      <MagicPanel className="p-8 border-white/5" glowColor="rgba(239,68,68,0.05)">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">
                 <Mic size={14} className="text-blue-400" /> Trigger VC
               </label>
               <select 
                 value={pomoConfig.voice_channel_id}
                 onChange={e => setPomoConfig({...pomoConfig, voice_channel_id: e.target.value})}
                 className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-red-500/40"
               >
                  <option value="">— Select VC —</option>
                  {channels.voiceChannels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
               </select>
            </div>
            <div className="space-y-4">
               <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">
                 <Hash size={14} className="text-cyan-400" /> HUD Text Channel
               </label>
               <select 
                 value={pomoConfig.text_channel_id}
                 onChange={e => setPomoConfig({...pomoConfig, text_channel_id: e.target.value})}
                 className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-red-500/40"
               >
                  <option value="">— Select Text Channel —</option>
                  {channels.textChannels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
               </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">Focus (MIN)</label>
               <input type="number" value={pomoConfig.focus_duration} onChange={e => setPomoConfig({...pomoConfig, focus_duration: parseInt(e.target.value)})} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-red-500/40" />
             </div>
             <div className="space-y-4">
               <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">Break (MIN)</label>
               <input type="number" value={pomoConfig.break_duration} onChange={e => setPomoConfig({...pomoConfig, break_duration: parseInt(e.target.value)})} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-red-500/40" />
             </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"><ArrowLeft size={16}/> Back</button>
            <DungeonButton variant="fire" icon={Save} onClick={handleSavePomo} disabled={saving || !pomoConfig.voice_channel_id || !pomoConfig.text_channel_id}>
               IGNITE ENGINE
            </DungeonButton>
          </div>
        </div>
      </MagicPanel>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Rank & Rewards</h2>
        <p className="text-slate-500 text-sm italic">Bestow ancient roles upon hunters who survive the ritual.</p>
      </div>

      <MagicPanel className="p-8 border-white/5" glowColor="rgba(168,85,247,0.05)">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Top 1 Hunter</label>
              <select value={config.top1_role_id} onChange={e => setConfig({...config, top1_role_id: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white outline-none">
                <option value="">— Select Role —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Top 10 Hunters</label>
              <select value={config.top10_role_id} onChange={e => setConfig({...config, top10_role_id: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white outline-none">
                <option value="">— Select Role —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic border-b border-white/5 pb-2">Milestone Rewards</div>
             <div className="space-y-3">
                {rewards.map(reward => (
                  <div key={reward.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center font-black text-purple-400 text-[10px] italic">{reward.required_hours}h</div>
                      <div className="text-xs font-bold text-slate-300">{roles.find(r => r.id === reward.role_id)?.name || 'Unknown Role'}</div>
                    </div>
                    <button onClick={() => handleDeleteReward(reward.id)} className="p-1.5 hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all rounded-lg"><CheckCircle2 size={14}/></button>
                  </div>
                ))}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-purple-500/[0.03] p-4 rounded-2xl border border-purple-500/10">
                   <div className="space-y-2">
                      <label className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Hours</label>
                      <input id="new-reward-hours" type="number" placeholder="10" className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Awarded Role</label>
                      <select id="new-reward-role" className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
                         <option value="">— Select —</option>
                         {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                   </div>
                   <DungeonButton variant="mana" className="h-9 text-[9px]" onClick={() => {
                     const h = document.getElementById('new-reward-hours').value;
                     const r = document.getElementById('new-reward-role').value;
                     if (h && r) {
                       handleAddReward(parseInt(h), r);
                       document.getElementById('new-reward-hours').value = '';
                       document.getElementById('new-reward-role').value = '';
                     }
                   }}>Manifest</DungeonButton>
                </div>
             </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"><ArrowLeft size={16}/> Back</button>
            <DungeonButton variant="mana" icon={Save} onClick={() => handleSaveConfig()} disabled={saving}>
              {saving ? 'SEALING REWARDS...' : 'SAVE & CONTINUE'}
            </DungeonButton>
          </div>
        </div>
      </MagicPanel>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Sanctuary Protocols</h2>
        <p className="text-slate-500 text-sm italic">Finalize the restricted ley-lines for your realm.</p>
      </div>

      <MagicPanel className="p-8 border-white/5" glowColor="rgba(59,130,246,0.05)">
        <div className="space-y-8">
          <div className="space-y-4">
             <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">
               <Shield size={14} className="text-blue-400" /> Restricted Command Channel
             </label>
             <select 
               value={config.bot_command_channel_id}
               onChange={e => setConfig({...config, bot_command_channel_id: e.target.value})}
               className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-blue-500/40"
             >
               <option value="">— Select Channel —</option>
               {channels.textChannels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
             </select>
          </div>

          <div className="space-y-4">
             <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">
               <Zap size={14} className="text-yellow-400" /> Announcement Portal (Level Ups)
             </label>
             <select 
               value={config.announcement_channel_id}
               onChange={e => setConfig({...config, announcement_channel_id: e.target.value})}
               className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-blue-500/40"
             >
               <option value="">— Select Channel —</option>
               {channels.textChannels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
             </select>
          </div>

          <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-6">
             <div className="p-3 bg-blue-500/10 rounded-xl"><CheckCircle2 className="text-blue-500" size={24}/></div>
             <div className="space-y-1">
                <div className="text-xs font-black uppercase tracking-widest italic text-white">Identity Verified</div>
                <p className="text-[10px] text-slate-500 italic max-w-sm">All ley-lines are aligned. Proceed to manifest the full dashboard interface.</p>
             </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"><ArrowLeft size={16}/> Back</button>
            <DungeonButton variant="fire" icon={Zap} onClick={() => handleSaveConfig()} disabled={saving || !config.bot_command_channel_id}>
              {saving ? 'MANIFESTING...' : 'FINALIZE RITUAL'}
            </DungeonButton>
          </div>
        </div>
      </MagicPanel>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-10 text-center py-10">
      <div className="space-y-4">
         <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
         </div>
         <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">Ritual Complete</h2>
         <p className="text-slate-500 text-lg italic max-w-xl mx-auto leading-relaxed">
            Your realm has been successfully tethered to the Scribe Core. Every hour of focus manifests into XP, fueling your ascent on the global leaderboard.
         </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
         <DungeonButton variant="mana" href={`/dashboard/${selectedGuild.id}/leaderboard`} className="h-14 uppercase tracking-widest font-black italic">Leaderboards</DungeonButton>
         <DungeonButton variant="fire" href={`/dashboard/${selectedGuild.id}`} className="h-14 uppercase tracking-widest font-black italic">Finalize Setup</DungeonButton>
      </div>

      <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.4em] pt-12 italic">Identity Authenticated • Scribe Active</p>
    </div>
  );

  const renderSteps = () => (
    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
      {STEPS.map(step => (
        <div 
          key={step.id} 
          className={`flex-shrink-0 flex items-center gap-4 p-4 rounded-xl border transition-all ${
            currentStep === step.id 
              ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
              : currentStep > step.id 
                ? 'border-green-500/20 opacity-60' 
                : 'border-transparent opacity-30'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic ${
            currentStep === step.id ? 'bg-blue-500 text-white' : currentStep > step.id ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500'
          }`}>
            {currentStep > step.id ? <CheckCircle2 size={16}/> : step.id}
          </div>
          <div className="hidden md:block">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Step 0{step.id}</div>
            <div className={`text-xs font-bold uppercase italic tracking-wider ${currentStep === step.id ? 'text-blue-400' : 'text-slate-300'}`}>
              {step.title}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const content = (
    <AnimatePresence mode="wait">
       <motion.div
         key={currentStep}
         initial={{ opacity: 0, x: 20 }}
         animate={{ opacity: 1, x: 0 }}
         exit={{ opacity: 0, x: -20 }}
         transition={{ duration: 0.4 }}
         className="w-full"
       >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
          {currentStep === 7 && renderStep7()}
       </motion.div>
    </AnimatePresence>
  );

  if (embedded) {
    return (
      <div className="w-full flex flex-col lg:flex-row gap-12">
        <aside className="w-full lg:w-72 flex-shrink-0">
           <div className="p-6 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-md">
              <div className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase italic mb-6">Ceremony Progress</div>
              {renderSteps()}
           </div>
        </aside>
        <div className="flex-1 w-full max-w-4xl">
           {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020205] text-[#e2e8f0] relative flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Progress (Cinematic) */}
      <aside className="w-full md:w-80 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 p-8 flex flex-col gap-10">
         <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]"><Zap size={20} className="text-white fill-white"/></div>
            <span className="font-black italic tracking-widest text-white uppercase text-xl">Scribe Setup</span>
         </div>

          {renderSteps()}

         <div className="mt-auto hidden md:block">
            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
               <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest"><AlertCircle size={14}/> Manifest Info</div>
               <p className="text-[11px] text-slate-500 italic leading-relaxed">The setup process manifests real configuration ley-lines in your database. Ensure your Discord authority is verified.</p>
            </div>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto px-6 py-12 md:p-20 flex flex-col items-center">
         <div className="max-w-2xl w-full">
            {content}
         </div>

         {/* Background Decor */}
         <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
         <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />
      </main>
    </div>
  );
}
