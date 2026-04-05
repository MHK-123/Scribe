import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ScrollText, AlertTriangle, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

const Section = ({ icon: Icon, title, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
        <Icon className="text-purple-400 w-5 h-5" />
      </div>
      <h3 className="text-xl font-bold text-white uppercase tracking-tight italic">{title}</h3>
    </div>
    <div className="text-slate-400 leading-relaxed font-medium space-y-4 pl-12 text-sm italic">
      {children}
    </div>
  </div>
);

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#020205] text-slate-200 py-20 px-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(168,85,247,0.1),transparent_50%)]" />
      
      <div className="max-w-3xl mx-auto relative z-10 space-y-12">
        <header className="text-center space-y-4">
          <Link to="/" className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] text-purple-400 hover:bg-white/10 transition-colors uppercase mb-8">
            Return to Sanctum
          </Link>
          <div className="flex justify-center mb-6 text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            <ScrollText size={64} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Terms of Manifestation</h1>
          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Last Harmonized: April 2026</p>
        </header>

        <div className="glass-card p-10 border-white/5 space-y-12 bg-black/40 backdrop-blur-xl rounded-3xl border shadow-2xl">
          
          <Section icon={Scale} title="Realm Usage">
            <p>
              The Scribe protocol is provided exclusively for **education, study tracking, and productivity**. By adding Scribe to your realm, you agree to use its features within the intended spirit of focused learning.
            </p>
            <p>
              Hunters are expected to maintain their study focus. Excessive manipulation of bot systems is discouraged.
            </p>
          </Section>

          <Section icon={AlertTriangle} title="Prohibited Sigils">
            <p>
              You agree not to use the bot to automate or scrape private user data beyond what is provided through public Discord commands.
            </p>
            <p>
              Attempting to "exploit" the leveling system by remaining in voice channels without active participation may result in XP reset or realm ban.
            </p>
          </Section>

          <Section icon={Shield} title="System Integrity">
            <p>
              As a guardian, Scribe is provided **"as-is"**. We do not guarantee 100% uptime of the manifestations. We are not liable for any data loss, server disruptions, or lost XP shards due to technical shadow realm glitches.
            </p>
          </Section>

          <Section icon={ScrollText} title="Manifest Changes">
            <p>
              We reserve the right to modify these terms as the Scribe system evolves into new archetypes. Continued interaction with the dashboard or bot commands constitutes acceptance of any updated rituals.
            </p>
          </Section>

          <footer className="pt-10 border-t border-white/5 text-center text-slate-500 text-[10px] font-bold tracking-widest uppercase">
            © 2026 Scribe Protocol · Governed by the Arcane Council
          </footer>
        </div>
      </div>
    </div>
  );
}
