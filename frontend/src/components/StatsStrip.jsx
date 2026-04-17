import { BrainCircuit, Layers, AlertCircle, Activity } from 'lucide-react';
import useCountUp from '../hooks/useCountUp';

export default function StatsStrip({ totalZones, anomalies, confidence }) {
  const animatedPrecision = useCountUp(parseFloat(confidence || 97.0), 2000, 1);
  const animatedAnomalies = useCountUp(anomalies, 1500, 0);

  const stats = [
    { label: 'Total zones', value: totalZones, sub: 'All channels active', Icon: Layers, color: 'var(--color-primary)' },
    { label: 'Anomalies', value: animatedAnomalies, sub: anomalies > 0 ? 'Action required' : 'Nominal status', Icon: AlertCircle, color: anomalies > 0 ? 'var(--color-primary)' : 'var(--color-success)' },
    { label: 'Uptime', value: '99.9', unit: '%', sub: 'Redundant nodes', Icon: Activity, color: 'var(--color-accent)' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((s, i) => (
        <div 
         key={i} 
         className="glass-aurora rounded-2xl p-4 flex items-center justify-between relative overflow-hidden group hover:bg-white/[0.08] h-20 border border-white/5"
        >
           <div className="flex items-center gap-4">
               {/* Floating Icon with Glow */}
               <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg" style={{ backgroundColor: `${s.color}20` }}>
                     <s.Icon size={18} style={{ color: s.color }} />
                  </div>
               </div>

               <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[9px] font-black tracking-widest text-white/40">{s.label}</span>
                  <span className="text-[8px] font-bold text-white/30 tracking-wide">{s.sub}</span>
               </div>
           </div>

           <div className="flex items-baseline gap-1 text-right">
              <span className="text-3xl font-black hero-text text-white">{s.value}</span>
              {s.unit && <span className="text-sm font-bold text-white/30">{s.unit}</span>}
           </div>

           {/* Decorative side cutouts to enhance visual appeal pb */}
           <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      ))}
    </div>

  );
}
