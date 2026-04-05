import React, { useContext, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, Shield, DatabaseBackup, Skull, Gem, ScrollText, AlertTriangle, Clock } from 'lucide-react';

import MagicPanel from '../components/MagicPanel.jsx';
import DungeonButton from '../components/DungeonButton.jsx';

export default function SettingsBackup() {
  const { id } = useParams();
  const { token, apiUrl } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [config, setConfig] = useState(null);
  const [channels, setChannels] = useState([]);
  const [savingTz, setSavingTz] = useState(false);
  const [savingBot, setSavingBot] = useState(false);

  React.useEffect(() => {
    // Aggressively reset state on server switch
    setConfig(null);
    setChannels([]);

    const headers = { Authorization: `Bearer ${token}` };
    
    // Fetch Settings
    axios.get(`${apiUrl}/settings/export/${id}`, { headers })
    .then(res => setConfig(res.data))
    .catch(console.error);

    // Fetch Channels for the dropdown
    axios.get(`${apiUrl}/guilds/${id}/channels`, { headers })
    .then(res => setChannels(res.data.textChannels || []))
    .catch(console.error);
  }, [id, apiUrl, token]);

  const handleExport = () => {
    setExporting(true);
    fetch(`${apiUrl}/settings/export/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `Dungeon_Backup_${id}.json`;
       document.body.appendChild(a);
       a.click();
       a.remove();
    })
    .catch(console.error)
    .finally(() => setExporting(false));
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
       try {
         const json = JSON.parse(event.target.result);
         await axios.post(`${apiUrl}/settings/import/${id}`, json, {
            headers: { Authorization: `Bearer ${token}` }
         });
         setConfig(json);
         alert('Ancient scrolls restored! Settings have been applied.');
       } catch (err) {
         alert('Invalid scroll file.');
       } finally {
         setImporting(false);
         if (fileInputRef.current) fileInputRef.current.value = '';
       }
    };
    reader.readAsText(file);
  };

  const handleTimezoneChange = async (newTz) => {
    setSavingTz(true);
    try {
      const updatedConfig = { ...config, reset_timezone: newTz };
      await axios.post(`${apiUrl}/settings/import/${id}`, updatedConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(updatedConfig);
    } catch (err) {
      alert('Failed to recalibrate temporal nodes.');
    } finally {
      setSavingTz(false);
    }
  };

  const handleBotChannelChange = async (channelId) => {
    setSavingBot(true);
    try {
      const updatedConfig = { 
        ...config, 
        bot_command_channel_id: channelId === 'all' ? null : channelId 
      };
      
      // We use the standard config save route
      await axios.post(`${apiUrl}/guilds/${id}/config`, updatedConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfig(updatedConfig);
    } catch (err) {
      console.error(err);
      alert('Failed to update bot command restrictions.');
    } finally {
      setSavingBot(false);
    }
  };

  const timezones = [
    { name: 'India (IST)', value: 'Asia/Kolkata' },
    { name: 'Universal (UTC)', value: 'UTC' },
    { name: 'Eastern (EST)', value: 'America/New_York' },
    { name: 'Central (CST)', value: 'America/Chicago' },
    { name: 'Pacific (PST)', value: 'America/Los_Angeles' },
    { name: 'London (GMT)', value: 'Europe/London' },
    { name: 'Tokyo (JST)', value: 'Asia/Tokyo' },
    { name: 'Dubai (GST)', value: 'Asia/Dubai' },
  ];

  return (
    <div className="max-w-4xl space-y-8 p-4">
      {/* Header */}
      <header className="space-y-2">
        <div className="text-[10px] font-bold tracking-[0.3em] text-blue-500/60 uppercase">Sanctum Archive</div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white flex items-center gap-4 uppercase">
           <DatabaseBackup className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={32} />
           Scroll Manifest
        </h1>
        <p className="text-slate-400 font-medium max-w-xl">
           Preserve your dungeon configuration through ancient data scrolls or restore from previous manifestations.
        </p>
      </header>

      {/* Timezone Calibration */}
      <MagicPanel className="p-6 border-blue-500/10" glowColor="rgba(59,130,246,0.05)">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Clock className="text-blue-400 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Temporal Calibration</h3>
              <p className="text-xs text-slate-400 font-medium">Synchronize the monthly reset ritual with your realm's local clock.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={config?.reset_timezone || 'Asia/Kolkata'}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              disabled={savingTz}
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all w-full md:w-64 appearance-none cursor-pointer"
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value} className="bg-[#0a0a0f] text-white">{tz.name}</option>
              ))}
            </select>
            {savingTz && <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />}
          </div>
        </div>
      </MagicPanel>

      {/* Bot Command Restriction */}
      <MagicPanel className="p-6 border-purple-500/10" glowColor="rgba(168,85,247,0.05)">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Shield className="text-purple-400 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Bot Command Node</h3>
              <p className="text-xs text-slate-400 font-medium">Restrict Hunter commands (-m, -l) to a specific manifestation channel.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={config?.bot_command_channel_id || 'all'}
              onChange={(e) => handleBotChannelChange(e.target.value)}
              disabled={savingBot || channels.length === 0}
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-purple-500/50 transition-all w-full md:w-64 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-[#0a0a0f] text-white">Allowed Everywhere</option>
              {channels.map(ch => (
                <option key={ch.id} value={ch.id} className="bg-[#0a0a0f] text-white">#{ch.name}</option>
              ))}
            </select>
            {savingBot && <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />}
          </div>
        </div>
      </MagicPanel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Export Card */}
        <MagicPanel className="p-8 border-white/5 flex flex-col group h-full" glowColor="rgba(59,130,246,0.03)">
           <div className="w-16 h-16 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-center mb-8 relative group-hover:border-blue-500/40 transition-colors">
              <Download className="text-blue-400 w-8 h-8" />
              <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
           </div>
           
           <div className="flex-1 space-y-4">
              <h3 className="text-xl font-black text-white tracking-tight uppercase italic flex items-center gap-2">
                 Manifest Scroll
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">
                 Create a permanent record of your Join-To-Create setup, room archetypes, and servant limits. This scroll is necessary to restore your sanctum in another realm.
              </p>
           </div>
           
           <div className="mt-8">
              <DungeonButton 
                variant="fire"
                onClick={handleExport}
                disabled={exporting}
                className="w-full h-14"
              >
                 <AnimatePresence mode="wait">
                    {exporting ? (
                       <motion.div key="exporting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Inscribing...</span>
                       </motion.div>
                    ) : (
                       <div key="default" className="flex items-center gap-3">
                          <ScrollText size={20} />
                          <span>Inscribe Data Scroll</span>
                       </div>
                    )}
                 </AnimatePresence>
              </DungeonButton>
           </div>
        </MagicPanel>

        {/* Import Card */}
        <MagicPanel className="p-8 border-white/5 flex flex-col group h-full" glowColor="rgba(168,85,247,0.03)">
           <div className="w-16 h-16 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-center mb-8 relative group-hover:border-purple-500/40 transition-colors">
              <Upload className="text-purple-400 w-8 h-8" />
              <div className="absolute inset-0 bg-purple-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
           </div>

           <div className="flex-1 space-y-4">
              <h3 className="text-xl font-black text-white tracking-tight uppercase italic flex items-center gap-2">
                 Absorb Scroll
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">
                 Heed the ancient data. Overwrite your current sanctuary configuration instantly from a previously inscribed JSON scroll. Proceed with caution.
              </p>
           </div>
           
           <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImport} 
           />
           
           <div className="mt-8">
              <DungeonButton 
                variant="mana"
                onClick={() => !importing && fileInputRef.current?.click()}
                disabled={importing}
                className="w-full h-14"
              >
                 <AnimatePresence mode="wait">
                    {importing ? (
                       <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Absorbing...</span>
                       </motion.div>
                    ) : (
                       <div key="default" className="flex items-center gap-3">
                          <Gem size={20} />
                          <span>Absorb Ancient Data</span>
                       </div>
                    )}
                 </AnimatePresence>
              </DungeonButton>
           </div>
        </MagicPanel>
        
      </div>
      
      {/* Warning Panel */}
      <MagicPanel className="p-5 border-orange-500/10 bg-orange-500/[0.02]" glowColor="rgba(249,115,22,0.05)">
         <div className="flex items-start gap-4 text-xs font-medium text-slate-400">
            <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
               <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <div className="space-y-1">
               <p className="text-slate-200 font-bold uppercase tracking-widest text-[10px]">Guardian Warning:</p>
               <p className="leading-relaxed">
                  Sanctum manifests are secure and contain NO private soul shards or sensitive logs. 
                  All scroll absorptions are finalized immediately across all active dungeon chambers.
               </p>
            </div>
         </div>
      </MagicPanel>

      <div className="flex justify-center pt-12 opacity-5">
         <Skull size={48} className="text-slate-500" />
      </div>
    </div>
  );
}
