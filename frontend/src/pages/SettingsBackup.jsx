import React, { useContext, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Download, Upload, Server, Shield, DatabaseBackup } from 'lucide-react';

export default function SettingsBackup() {
  const { id } = useParams();
  const { token, apiUrl } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    // Using fetch to trigger download properly with Bearer token
    fetch(`${apiUrl}/settings/export/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `StudyForge_${id}_Backup.json`;
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
         alert('Backup imported successfully! Settings have been applied.');
       } catch (err) {
         alert('Invalid backup file. Please ensure it is a valid StudyForge JSON export.');
       } finally {
         setImporting(false);
         if (fileInputRef.current) fileInputRef.current.value = '';
       }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="max-w-4xl space-y-8"
    >
      <div className="mb-10">
         <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <DatabaseBackup className="text-accent" />
            Settings & Backup
         </h1>
         <p className="text-gray-400 text-lg">
            Manage your server configuration data securely.
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export Card */}
        <div className="glass-card p-8 rounded-2xl border border-border/80 flex flex-col relative overflow-hidden group">
           {/* Decorative bg glow */}
           <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
           
           <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 relative z-10">
              <Download className="text-emerald-400 w-6 h-6" />
           </div>
           
           <div className="flex-1 relative z-10">
              <h3 className="text-xl font-semibold mb-3 text-[#ededed]">Export Configuration</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                 Download a complete JSON snapshot of your current Join-To-Create setup, room preferences, and server limits. Keep this safe to restore your configuration later.
              </p>
           </div>
           
           <button 
             onClick={handleExport}
             disabled={exporting}
             className="relative z-10 w-full flex justify-center items-center gap-2 bg-surface hover:bg-surface-hover border border-emerald-500/30 hover:border-emerald-500/50 transition-all px-6 py-3.5 rounded-xl font-semibold text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)] hover:shadow-[0_0_20px_rgba(52,211,153,0.2)] disabled:opacity-50"
           >
              {exporting ? (
                 <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                 </span>
              ) : (
                 <>
                    <Download size={18} /> Generate Backup File
                 </>
              )}
           </button>
        </div>

        {/* Import Card */}
        <div className="glass-card p-8 rounded-2xl border border-border/80 flex flex-col relative overflow-hidden group">
           {/* Decorative bg glow */}
           <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-accent/20 transition-colors duration-700"></div>

           <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 relative z-10">
              <Upload className="text-accent w-6 h-6" />
           </div>

           <div className="flex-1 relative z-10">
              <h3 className="text-xl font-semibold mb-3 text-[#ededed]">Import Configuration</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                 Restore your dashboard settings from a previously saved JSON backup. Proceed with caution, as this action will overwrite your current configuration instantly.
              </p>
           </div>
           
           <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImport} 
           />
           
           <button 
             onClick={() => !importing && fileInputRef.current?.click()}
             disabled={importing}
             className="relative z-10 w-full overflow-hidden group flex justify-center items-center gap-2 bg-accent hover:bg-[#6c78e6] transition-all px-6 py-3.5 rounded-xl font-semibold text-white shadow-[0_0_15px_rgba(94,106,210,0.2)] hover:shadow-[0_0_25px_rgba(94,106,210,0.4)] disabled:opacity-50"
           >
              {importing ? (
                 <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Restoring...
                 </span>
              ) : (
                 <>
                    <Upload size={18} className="relative z-10" /> 
                    <span className="relative z-10">Upload JSON Backup</span>
                    <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
                 </>
              )}
           </button>
        </div>
        
      </div>
      
      <div className="mt-8 p-4 bg-surface/50 border border-border rounded-xl flex items-start gap-4 text-sm text-gray-400">
         <Shield className="w-5 h-5 text-accent mt-0.5" />
         <p>
            StudyForge securely manages configuration data. Backups do not contain private user logs or sensitive chat data. 
            All modifications applied through import are immediately fully enforced to active rooms.
         </p>
      </div>
    </motion.div>
  );
}
