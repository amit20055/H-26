import { createFileRoute } from '@tanstack/react-router';
import { useAppData } from '../DataContext';
import StatsStrip from '../components/StatsStrip';
import MLExplainer from '../components/MLExplainer';
import ZoneCard from '../components/ZoneCard';
import NetworkTopology from '../components/NetworkTopology';
import MapComponent from '../components/MapComponent';
import { ShieldCheck, Zap, Activity, Info } from 'lucide-react';

function IndexComponent() {
  const { data, ZONE_NAMES } = useAppData();
  const zones = Object.keys(data.recent).sort();
  const anomalyCount = Object.values(data.recent).filter(z => z.is_anomaly).length;
  const avgConfidence = zones.length > 0
    ? (zones.reduce((s, z) => s + (data.recent[z]?.confidence || 97), 0) / zones.length).toFixed(1)
    : '—';

  return (
    <div className="flex flex-col gap-6 animate-entrance relative z-10">
      {/* Hero Header: AI Precision + Arches */}
      <StatsStrip totalZones={zones.length || 5} anomalies={anomalyCount} confidence={avgConfidence} />

      {/* Real-time telemetry Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between px-4">
          <div className="flex flex-col gap-1">
             <span className="text-[10px] font-black tracking-[0.4em] text-white/30 uppercase italic">Real-time telemetry</span>
             <h2 className="text-4xl font-black hero-text text-white">Active nodes</h2>
          </div>
          <button className="text-[11px] font-black tracking-widest text-primary uppercase border-b-2 border-primary/20 hover:border-primary transition-all pb-1">
            View all
          </button>
        </div>

        {/* Row 1: Zones A, B, C */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {zones.slice(0, 3).map(zone => (
            <ZoneCard
              key={zone}
              zoneId={zone}
              regionName={ZONE_NAMES[zone] || zone}
              data={data.recent[zone]}
              history={(data.history || []).filter(h => h.zone === zone).slice(-20)}
            />
          ))}
        </div>

        {/* Row 2: Zones D, E centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[66%] mx-auto w-full mt-2">
          {zones.slice(3, 5).map(zone => (
            <ZoneCard
              key={zone}
              zoneId={zone}
              regionName={ZONE_NAMES[zone] || zone}
              data={data.recent[zone]}
              history={(data.history || []).filter(h => h.zone === zone).slice(-20)}
            />
          ))}
        </div>
      </section>

      {/* Infrastructure Topology & Map */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-4 px-4 text-white/30">
           <Activity size={18} />
           <span className="text-[10px] font-black tracking-[0.4em] uppercase">Live Infrastructure</span>
           <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           <NetworkTopology data={data} />
           <MapComponent data={data} ZONE_NAMES={ZONE_NAMES} />
        </div>
      </section>

      {/* Intelligence Bento Hub */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
         {/* Security Card */}
         <div className="lg:col-span-5 glass-aurora p-8 rounded-[40px] flex flex-col gap-6 group">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
                  <ShieldCheck size={24} />
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Security protocol</span>
                  <h3 className="text-xl font-extrabold text-white">Isolation Forest active</h3>
               </div>
            </div>
            <p className="text-sm font-medium text-white/50 leading-relaxed">
               Continuous monitoring across all 5 channels. System integrity verified for next inference cycle.
            </p>
            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-white/30 tracking-widest uppercase">Recall</span>
                  <span className="text-lg font-black text-success">99.2%</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-white/30 tracking-widest uppercase">Entropy</span>
                  <span className="text-lg font-black text-accent">0.12</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-white/30 tracking-widest uppercase">Latency</span>
                  <span className="text-lg font-black text-info">12ms</span>
               </div>
            </div>
         </div>

         {/* SVG Donut Charts & Summary */}
         <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-aurora p-8 rounded-[40px] flex items-center justify-around">
               <MLExplainer />
            </div>
            
            <div className="flex flex-col gap-6">
               {[
                  { label: 'Throughput', val: '1.2 GB/s', icon: Zap, color: 'text-accent' },
                  { label: 'Avg pressure', val: '2.93 bar', icon: Activity, color: 'text-primary' },
                  { label: 'Total flow', val: '507 L/s', icon: Info, color: 'text-success' },
               ].map((item, i) => (
                  <div key={i} className="flex-1 glass-aurora p-6 rounded-3xl flex flex-col justify-between group">
                     <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase">{item.label}</span>
                        <item.icon size={14} className={item.color} />
                     </div>
                     <span className="text-xl font-black text-white group-hover:text-primary transition-colors">{item.val}</span>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Footer Branded Bar */}
      <footer className="py-8 border-t border-white/5 text-center">
         <p className="text-[10px] font-black tracking-[0.5em] text-white/20 uppercase">
            Strategic Water Management — Powered by Isolation Forest v2
         </p>
      </footer>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: IndexComponent,
});
