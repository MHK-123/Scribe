import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Mic, Timer, Heart, Zap, Shield, Plus, ArrowRight, ArrowLeft, 
  CheckCircle2, AlertCircle, Save, FolderOpen, Hash, RefreshCw
} from 'lucide-react';
import MagicPanel from '../components/MagicPanel.jsx';
import DungeonButton from '../components/DungeonButton.jsx';

const STEPS = [
  { id: 1, title: "Choose Realm", icon: <Server size={18}/> },
  { id: 2, title: "VC Setup", icon: <Mic size={18}/> },
  { id: 3, title: "Pomodoro Setup", icon: <Timer size={18}/> },
  { id: 4, title: "Start Session", icon: <Zap size={18}/> },
  { id: 5, title: "Verify System", icon: <CheckCircle2 size={18}/> },
  { id: 6, title: "Leaderboards", icon: <Heart size={18}/> }
];

export default function SetupWizard() {
  const { token, apiUrl, user } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [channels, setChannels] = useState({ voiceChannels: [], categories: [], textChannels: [] });
  const [chLoading, setChLoading] = useState(false);
  const [vcConfig, setVcConfig] = useState({ join_to_create_channel: '', temp_vc_category: '' });
  const [pomoConfig, setPomoConfig] = useState({ voice_channel_id: '', text_channel_id: '', focus_duration: 50, break_duration: 10 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ─── EFFECTS ───────────────────────────────────────────────────────────────

  // Fetch guilds for Step 1
  useEffect(() => {
    if (currentStep === 1) {
      setLoading(true);
      axios.get(`${apiUrl}/guilds`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setGuilds(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [currentStep, apiUrl, token]);

  // Fetch channels when a guild is selected
  useEffect(() => {
    if (selectedGuild) {
      setChLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch Channels
      axios.get(`${apiUrl}/guilds/${selectedGuild.id}/channels`, { headers })
        .then(res => {
          setError(null);
          setChannels(res.data);
        })
        .catch(err => {
          console.error(err);
          setError(err.response?.data?.error || "Ritual Sync Failed");
        })
        .finally(() => setChLoading(false));

      // Fetch existing configs to pre-fill
      axios.get(`${apiUrl}/guilds/${selectedGuild.id}/config`, { headers })
        .then(res => {
          if (res.data) {
            setVcConfig({
              join_to_create_channel: res.data.join_to_create_channel || '',
              temp_vc_category: res.data.temp_vc_category || ''
            });
          }
        });

      axios.get(`${apiUrl}/pomodoro/${selectedGuild.id}/configs`, { headers })
        .then(res => {
           if (res.data && res.data.length > 0) {
             const c = res.data[0]; // Take first config
             setPomoConfig({
               voice_channel_id: c.voice_channel_id || '',
               text_channel_id: c.text_channel_id || '',
               focus_duration: c.focus_duration || 50,
               break_duration: c.break_duration || 10
             });
           }
        });
    }
  }, [selectedGuild, apiUrl, token]);

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  const nextStep = () => setCurrentStep(prev => Math.min(6, prev + 1));
  const prevStep = () => setCurrentStep(prev => Math.max(1, prev - 1));

  const handleSaveVc = async () => {
    if (!vcConfig.join_to_create_channel || !vcConfig.temp_vc_category) return;
    setSaving(true);
    try {
      await axios.post(`${apiUrl}/guilds/${selectedGuild.id}/config`, vcConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      nextStep();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePomo = async () => {
    if (!pomoConfig.voice_channel_id || !pomoConfig.text_channel_id) return;
    setSaving(true);
    try {
      await axios.post(`${apiUrl}/pomodoro/${selectedGuild.id}/config`, pomoConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      nextStep();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ─── RENDERERS ──────────────────────────────────────────────────────────────

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
                  window.open(`https://discord.com/api/oauth2/authorize?client_id=1488552752333455481&permissions=8&scope=bot%20applications.commands`, '_blank');
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
                {guild.is_installed && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded flex items-center justify-center border border-black"><Shield size={10} className="text-white fill-white"/></div>}
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
          {guilds.length === 0 && !loading && (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-4">No servers found.</p>
              <DungeonButton variant="mana" icon={RefreshCw} onClick={() => window.location.reload()}>Refresh Realms</DungeonButton>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">VC Setup (Spawn Configuration)</h2>
        <p className="text-slate-500 text-sm italic">Define the geometric parameters for temporary voice dungeons.</p>
      </div>

      <MagicPanel className="p-8 border-white/5" glowColor="rgba(59,130,246,0.05)">
        <div className="space-y-8">
          <div className="space-y-4">
             <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">
               <Mic size={14} className="text-blue-400" /> Anchor VC (Primary Node)
             </label>
             <select 
               value={vcConfig.join_to_create_channel}
               onChange={e => setVcConfig({...vcConfig, join_to_create_channel: e.target.value})}
               className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-blue-500/40"
             >
               <option value="">{error ? `⚠️ ${error}` : '— Select anchor channel —'}</option>
               {(channels.voiceChannels || []).map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
             </select>
          </div>

          <div className="space-y-4">
             <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">
               <FolderOpen size={14} className="text-purple-400" /> Void Category (Target)
             </label>
             <select 
               value={vcConfig.temp_vc_category}
               onChange={e => setVcConfig({...vcConfig, temp_vc_category: e.target.value})}
               className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-blue-500/40"
             >
               <option value="">{error ? `⚠️ ${error}` : '— Select ritual space —'}</option>
               {(channels.categories || []).map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
             </select>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"><ArrowLeft size={16}/> Back</button>
            <DungeonButton variant="mana" icon={Save} onClick={handleSaveVc} disabled={saving || !vcConfig.join_to_create_channel || !vcConfig.temp_vc_category}>
              {saving ? 'INCANTING...' : 'SAVE & CONTINUE'}
            </DungeonButton>
          </div>
        </div>
      </MagicPanel>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Pomodoro Setup (Focus Engine)</h2>
        <p className="text-slate-500 text-sm italic">Automate your study rituals with reactive focus timers.</p>
      </div>

      <MagicPanel className="p-8 border-white/5" glowColor="rgba(59,130,246,0.05)">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">
                 <Mic size={14} className="text-blue-400" /> Voice Channel
               </label>
               <select 
                 value={pomoConfig.voice_channel_id}
                 onChange={e => setPomoConfig({...pomoConfig, voice_channel_id: e.target.value})}
                 className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-blue-500/40"
               >
                  <option value="">{error ? `⚠️ ${error}` : '— Select VC —'}</option>
                  {(channels.voiceChannels || []).map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                </select>
            </div>
            <div className="space-y-4">
               <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">
                 <Hash size={14} className="text-cyan-400" /> Text Channel
               </label>
               <select 
                 value={pomoConfig.text_channel_id}
                 onChange={e => setPomoConfig({...pomoConfig, text_channel_id: e.target.value})}
                 className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-blue-500/40"
               >
                  <option value="">{error ? `⚠️ ${error}` : '— Select channel —'}</option>
                  {(channels.textChannels || []).map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">Focus Duration (MIN)</label>
               <input type="number" value={pomoConfig.focus_duration} onChange={e => setPomoConfig({...pomoConfig, focus_duration: parseInt(e.target.value)})} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-blue-500/40" />
             </div>
             <div className="space-y-4">
               <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase italic">Break Duration (MIN)</label>
               <input type="number" value={pomoConfig.break_duration} onChange={e => setPomoConfig({...pomoConfig, break_duration: parseInt(e.target.value)})} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-blue-500/40" />
             </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"><ArrowLeft size={16}/> Back</button>
            <DungeonButton variant="fire" icon={Save} onClick={handleSavePomo} disabled={saving || !pomoConfig.voice_channel_id || !pomoConfig.text_channel_id}>
               {saving ? 'SAVING RITUAL...' : 'SAVE & CONTINUE'}
            </DungeonButton>
          </div>
        </div>
      </MagicPanel>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-10 text-center">
      <div className="mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2 text-blue-500">Ignite Your Focus</h2>
        <p className="text-slate-500 text-sm italic">The configuration is manifest. It is time to begin the ritual.</p>
      </div>

      <MagicPanel className="p-10 border-white/5 bg-blue-500/[0.02]" glowColor="rgba(59,130,246,0.1)">
        <div className="space-y-8">
           <div className="p-6 bg-black/40 border border-blue-500/20 rounded-2xl inline-block mb-4">
              <Zap size={48} className="text-blue-500 animate-pulse" />
           </div>
           <div className="space-y-4">
              <h3 className="text-xl font-black italic uppercase text-white tracking-widest">Join Configured VC</h3>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                Joining <span className="text-blue-400 font-bold">#{channels.voiceChannels.find(c => c.id === pomoConfig.voice_channel_id)?.name}</span> will instantly trigger the Focus Engine. 
                Scribe will manifest a HUD in the linked text channel to guide your ritual.
              </p>
           </div>
           <div className="flex justify-center gap-6 pt-6">
              <DungeonButton variant="mana" icon={ArrowRight} onClick={nextStep} className="h-14 px-10">Next Strategy</DungeonButton>
           </div>
        </div>
      </MagicPanel>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-8 text-center">
      <div className="mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Verify Manifestation</h2>
        <p className="text-slate-500 text-sm italic">Ensure your sanctuary ley-lines are correctly aligned.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <MagicPanel className="p-8 border-white/5 text-left space-y-4">
           <div className="section-label">System Overview</div>
           <p className="text-slate-400 text-sm italic">Track active users and cumulative focus hours across your entire realm.</p>
           <DungeonButton variant="mana" href={`/dashboard/${selectedGuild.id}`} className="w-full h-12 text-xs">Access Overview</DungeonButton>
        </MagicPanel>
        <MagicPanel className="p-8 border-white/5 text-left space-y-4">
           <div className="section-label">Voice Monitor</div>
           <p className="text-slate-400 text-sm italic">Trace active rooms and temporary dungeons in real-time manifestation.</p>
           <DungeonButton variant="mana" href={`/dashboard/${selectedGuild.id}/monitor`} className="w-full h-12 text-xs">Open Monitor</DungeonButton>
        </MagicPanel>
      </div>

      <div className="pt-10">
        <DungeonButton variant="fire" icon={ArrowRight} onClick={nextStep} className="h-14 px-10">Final Revelation</DungeonButton>
      </div>
    </div>
  );

  const renderStep6 = () => (
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

  return (
    <div className="min-h-screen bg-[#020205] text-[#e2e8f0] relative flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Progress (Cinematic) */}
      <aside className="w-full md:w-80 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 p-8 flex flex-col gap-10">
         <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]"><Zap size={20} className="text-white fill-white"/></div>
            <span className="font-black italic tracking-widest text-white uppercase text-xl">Scribe Setup</span>
         </div>

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
               </motion.div>
            </AnimatePresence>
         </div>

         {/* Background Decor */}
         <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
         <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />
      </main>
    </div>
  );
}
