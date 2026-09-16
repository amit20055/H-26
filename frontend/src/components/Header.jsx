import { Activity, Radio } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useAppData } from '../DataContext';

export default function Header({ voiceEnabled, setVoiceEnabled }) {
  const navigate = useNavigate();
  const { data, isBackendConnected, retryConnection } = useAppData();
  
  // Create ticker items from live data
  const tickerItems = Object.entries(data.recent || {}).map(([zone, readings]) => ({
    label: zone,
    value: readings.pressure ? readings.pressure.toFixed(2) + ' BAR' : '--',
    isAnomaly: readings.is_anomaly
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => navigate({ to: '/' })}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/20 transition-transform group-hover:scale-110">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="M2 11c5-5 15-5 20 0" /><path d="M2 15c5-5 15-5 20 0" /><path d="M2 19c5-5 15-5 20 0" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.4em] text-muted uppercase">Strategic Water Intelligence</span>
            <h1 className="text-3xl font-black hero-text bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Command <span className="text-primary italic">Center</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button
            onClick={() => navigate({ to: '/compare' })}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 hover:scale-105 bg-white/5 hover:bg-white/10 text-white border border-white/10"
          >
            COMPARE
          </button>
          
          <button
            onClick={retryConnection}
            title={isBackendConnected ? "Connected to Python Flask Backend" : "Running in client-side simulator mode. Click to retry backend connection."}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer ${
              isBackendConnected 
                ? 'border-success/30 bg-success/10 text-success' 
                : 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              isBackendConnected ? 'bg-success animate-pulse shadow-[0_0_10px_var(--color-success)]' : 'bg-amber-400 animate-ping'
            }`} />
            <span className="text-[11px] font-black tracking-widest uppercase">
              {isBackendConnected ? 'LIVE BACKEND' : 'DEMO SIMULATOR'}
            </span>
          </button>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              voiceEnabled ? 'bg-primary text-white scale-110' : 'bg-white/5 text-muted hover:text-white'
            } border border-white/10 shadow-lg`}
          >
            <Radio size={20} />
          </button>
        </div>
      </header>

      {/* Marquee Ticker */}
      <div className="w-full h-12 glass-aurora border-y border-white/5 overflow-hidden flex items-center">
        <div className="animate-marquee flex gap-12 items-center whitespace-nowrap">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
               <div className={`w-1.5 h-1.5 rounded-full ${item.isAnomaly ? 'bg-primary animate-pulse' : 'bg-success'}`} />
               <span className="text-[11px] font-bold text-muted uppercase tracking-widest">{item.label}</span>
               <span className="text-[11px] font-black text-white bg-white/5 px-2 py-0.5 rounded-md">{item.value}</span>
               <span className="text-white/10">|</span>
            </div>
          ))}
          
          {/* Constant status items */}
          <div className="flex items-center gap-4">
             <span className="text-[11px] font-black text-primary uppercase tracking-widest">System Nominal</span>
             <span className="text-white/20">◆</span>
             <span className="text-[11px] font-bold text-muted uppercase tracking-widest">AI Model: Isolation Forest v2</span>
             <span className="text-white/20">◆</span>
             <span className="text-[11px] font-bold text-muted uppercase tracking-widest">Latency: 12ms</span>
             <span className="text-white/20">|</span>
          </div>
        </div>
      </div>
    </div>
  );
}
