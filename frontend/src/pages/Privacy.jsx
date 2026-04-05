import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Database, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Section = ({ icon: Icon, title, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <Icon className="text-blue-400 w-5 h-5" />
      </div>
      <h3 className="text-xl font-bold text-white uppercase tracking-tight italic">{title}</h3>
    </div>
    <div className="text-slate-400 leading-relaxed font-medium space-y-4 pl-12 text-sm italic">
      {children}
    </div>
  </div>
);

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#020205] text-slate-200 py-20 px-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <div className="max-w-3xl mx-auto relative z-10 space-y-12">
        <header className="text-center space-y-4">
          <Link to="/" className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] text-blue-400 hover:bg-white/10 transition-colors uppercase mb-8">
            Return to Sanctum
          </Link>
          <div className="flex justify-center mb-6 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Shield size={64} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Privacy Manifest</h1>
          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Last Synchronized: April 2026</p>
        </header>

        <div className="glass-card p-10 border-white/5 space-y-12 bg-black/40 backdrop-blur-xl rounded-3xl border shadow-2xl">
          
          <Section icon={Eye} title="Data Collection">
            <p>
              When you interact with the Scribe system, we collect essential metadata required to track your study progress. This includes your unique **Discord User ID**, **Username**, and **Avatar URL**. 
            </p>
            <p>
              To provide server-specific features, we also record the **Guild IDs** and **Channel IDs** where the bot is active.
            </p>
          </Section>

          <Section icon={Database} title="Usage of Essence">
            <p>
              The primary purpose of data collection is to fuel the **Leveling and Ranking systems**. We record the duration of your voice channel study sessions and convert them into XP and Levels.
            </p>
            <p>
              This data is visible to other hunters within the same realm via the **Leaderboard** and **Profile** commands.
            </p>
          </Section>

          <Section icon={Lock} title="Data Secrecy">
            <p>
              Your soul shards are safe with us. We **never** sell, trade, or share your data with external third-party shadows. All data is stored securely in our encrypted database clusters.
            </p>
            <p>
              We do not record your voice audio or private messages. Only the *state* of your presence in study channels is monitored.
            </p>
          </Section>

          <Section icon={Link2} title="Third-Party Services">
            <p>
              🔗 This application is hosted using third-party platforms such as **Vercel** and **Render**.
            </p>
            <p>
              These services may process basic data such as requests, IP addresses, and logs in order to provide hosting and maintain performance.
            </p>
            <p>
              We do not directly control how these platforms handle data. For more information, please refer to their respective privacy policies.
            </p>
          </Section>

          <Section icon={Shield} title="Revocation">
            <p>
              You have the right to purge your metadata at any time. Removing the bot from a realm or requesting data deletion through the official support channels will result in the permanent erasure of your recorded stats.
            </p>
          </Section>

          <footer className="pt-10 border-t border-white/5 text-center text-slate-500 text-[10px] font-bold tracking-widest uppercase">
            © 2026 Scribe Protocol · Managed by the Sanctum Guardians
          </footer>
        </div>
      </div>
    </div>
  );
}
