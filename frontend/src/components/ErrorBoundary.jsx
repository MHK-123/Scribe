import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical System Failure:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020205] flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-white/5 border border-red-500/20 rounded-3xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.1)] text-center relative overflow-hidden">
             {/* Background Glow */}
             <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full pointer-events-none" />
             
             <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <ShieldAlert size={40} className="text-red-500 animate-pulse" />
             </div>
             
             <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-3">Portal Collapsed</h2>
             <p className="text-slate-400 text-sm mb-8 leading-relaxed italic">
                A critical instability was detected in the mana stream. The current node has been terminated to prevent data leak.
             </p>
             
             <div className="flex flex-col gap-3">
                <button 
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase italic tracking-widest transition-all shadow-lg active:scale-95"
                >
                  <RefreshCw size={18} /> Re-Initialize Portal
                </button>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold uppercase italic tracking-widest transition-all border border-white/5"
                >
                  <Home size={18} /> Return to Home
                </button>
             </div>

             <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[10px] font-mono text-red-500/50 uppercase tracking-widest">
                  Error Code: {this.state.error?.name || 'UNKNOWN_ANOMALY'}
                </p>
             </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
