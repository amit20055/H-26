import { useNavigate } from '@tanstack/react-router';
import { Activity, Droplets, Zap } from 'lucide-react';
import useCountUp from '../hooks/useCountUp';

export default function ZoneCard({ zoneId, regionName, data, history }) {
  const navigate = useNavigate();
  if (!data) return null;

  const isAnomaly = data.is_anomaly;
  const idLetter = zoneId.split(' ')[1]; // Get 'A', 'B', etc.
  const animatedConfidence = useCountUp(data.confidence || 97.4, 2000, 1);

  // Sparkline generator
  const sparkPoints = history.map((h, i) => {
    const x = (i / Math.max(history.length - 1, 1)) * 100;
    const y = 20 - ((h.pressure - 1.5) / 4) * 20;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div
      onClick={() => navigate({ to: '/zone/$zoneId', params: { zoneId: idLetter } })}
      className="glass-aurora ticket-cutout rounded-3xl cursor-pointer flex items-stretch group overflow-hidden transition-all duration-500 hover:scale-[1.02]"
    >
      {/* Left Section: Details */}
      <div className="flex-1 p-5 flex flex-col gap-5 ticket-divider relative">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">{regionName}</span>
          <h3 className="text-2xl font-black hero-text text-white">Zone {idLetter}</h3>
        </div>

        <div className="flex items-center gap-4">
           {isAnomaly ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black tracking-widest uppercase">Anomaly</span>
              </div>
           ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/20 border border-success/40 text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="text-[10px] font-black tracking-widest uppercase">Optimal</span>
              </div>
           )}
           <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 tracking-widest uppercase">
              <Zap size={10} />
              Live
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1.5 text-white/40">
                <Activity size={12} className="text-primary" />
                <span className="text-[9px] font-black tracking-widest uppercase">Pressure</span>
             </div>
             <p className="text-[17px] font-black text-white leading-tight">{data.pressure?.toFixed(2)} <span className="text-[10px] font-medium opacity-40 italic">bar</span></p>
          </div>
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1.5 text-white/40">
                <Droplets size={12} className="text-accent" />
                <span className="text-[9px] font-black tracking-widest uppercase">Flow</span>
             </div>
             <p className="text-[17px] font-black text-white leading-tight">{data.flow_rate?.toFixed(1)} <span className="text-[10px] font-medium opacity-40 italic">L/s</span></p>
          </div>
        </div>

        {/* Mini Sparkline */}
        <div className="h-10 w-full mt-2 relative">
          <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
             <polyline
                points={sparkPoints}
                fill="none"
                stroke={isAnomaly ? 'var(--color-primary)' : 'var(--color-accent)'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-700"
             />
          </svg>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="text-[9px] font-black text-white/40 tracking-widest uppercase italic">AI conf.</span>
           </div>
           <span className="text-[12px] font-black text-primary">{animatedConfidence}%</span>
        </div>
      </div>

      {/* Right Section: Alphanumeric Ticket Stub */}
      <div className={`w-16 flex items-center justify-center transition-colors duration-500 overflow-hidden relative ${
        isAnomaly ? 'bg-primary/20' : 'bg-accent/20'
      }`}>
         {/* Stub text */}
         <span className="text-6xl font-black hero-text text-white opacity-40 group-hover:opacity-100 transition-opacity transform -rotate-12 group-hover:rotate-0 duration-500">
            {idLetter}
         </span>
         
         {/* Decorative perforation shadow */}
         <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
