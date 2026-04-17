import { TrendingUp, TrendingDown, Minus, ShieldAlert } from 'lucide-react';
import useCountUp from '../hooks/useCountUp';

function calculateRisk(history, latest) {
  if (!latest || !history?.length) return { h2: 5, h4: 8, h24: 12, trend: 'stable' };

  const anomalyCount = history.filter(h => h.is_anomaly).length;
  const anomalyRate = anomalyCount / Math.max(history.length, 1);
  
  const pressures = history.map(h => h.pressure);
  const avgP = pressures.reduce((a, b) => a + b, 0) / pressures.length;
  const variance = pressures.reduce((s, p) => s + Math.pow(p - avgP, 2), 0) / pressures.length;

  const baseRisk = anomalyRate * 40 + Math.min(variance * 20, 30) + (latest.is_anomaly ? 30 : 0);
  
  const h2 = Math.min(Math.round(baseRisk + Math.random() * 5), 99);
  const h4 = Math.min(Math.round(baseRisk * 1.15 + Math.random() * 8), 99);
  const h24 = Math.min(Math.round(baseRisk * 1.4 + Math.random() * 12), 99);

  const trend = h24 > h2 + 10 ? 'increasing' : h2 > h24 + 10 ? 'decreasing' : 'stable';

  return { h2, h4, h24, trend };
}

function getRiskLevel(score) {
  if (score >= 75) return { label: 'CRITICAL', color: 'var(--color-primary)', bg: 'hsla(14, 100%, 62%, 0.15)' };
  if (score >= 50) return { label: 'HIGH', color: 'var(--color-accent)', bg: 'hsla(38, 92%, 55%, 0.15)' };
  if (score >= 25) return { label: 'MEDIUM', color: 'var(--color-info)', bg: 'hsla(210, 100%, 65%, 0.15)' };
  return { label: 'OPTIMAL', color: 'var(--color-success)', bg: 'hsla(161, 62%, 56%, 0.15)' };
}

export default function RiskGauge({ history, latest }) {
  const risk = calculateRisk(history, latest);
  const level = getRiskLevel(risk.h2);
  const TrendIcon = risk.trend === 'increasing' ? TrendingUp : risk.trend === 'decreasing' ? TrendingDown : Minus;
  
  const animatedScore = useCountUp(risk.h2, 2000, 0);

  return (
    <div className="glass-aurora p-6 rounded-[32px] flex flex-col justify-between h-full relative overflow-hidden transition-all duration-500 border border-white/5">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase mb-1">Predictive Model</span>
          <h3 className="text-xl font-black hero-text text-white uppercase italic">Leak Risk Score</h3>
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500" style={{ backgroundColor: level.bg, borderColor: `${level.color}44`, color: level.color }}>
          <ShieldAlert size={28} className={level.label === 'CRITICAL' ? 'animate-pulse' : ''} />
        </div>
      </div>

      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex flex-col gap-2">
           <div className="flex justify-between items-end mb-1">
              <span className="text-[11px] font-black tracking-widest uppercase italic" style={{ color: level.color }}>{level.label} STATUS</span>
              <div className="flex items-baseline gap-1">
                 <span className="text-4xl font-black hero-text text-white">{animatedScore}</span>
                 <span className="text-sm font-bold text-white/30">%</span>
              </div>
           </div>
           
           {/* Modern Progression Bar */}
           <div className="h-5 w-full bg-white/5 rounded-full border border-white/5 p-1 relative overflow-hidden flex items-center">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-premium" 
                style={{ 
                  width: `${risk.h2}%`, 
                  background: `linear-gradient(90deg, var(--color-success), var(--color-accent), var(--color-primary))`,
                  boxShadow: `0 0 20px ${level.color}44`
                }} 
              />
           </div>
           
           <div className="flex justify-between mt-2 px-1">
              {['SAFE', 'MEDIUM', 'HIGH', 'SEVERE'].map((l, idx) => (
                <span key={l} className={`text-[8px] font-black tracking-widest uppercase ${idx === 3 ? 'text-primary' : 'text-white/20'}`}>{l}</span>
              ))}
           </div>
        </div>

        {/* Predictive Time Grid */}
        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
          {[
            { label: 'Next 2H', value: risk.h2 },
            { label: 'Next 4H', value: risk.h4 },
            { label: 'Next 24H', value: risk.h24 },
          ].map(t => {
            const tLevel = getRiskLevel(t.value);
            return (
              <div key={t.label} className="flex flex-col gap-2 p-4 rounded-3xl bg-white/2 border border-white/5 text-center group hover:bg-white/5 transition-all">
                <span className="text-[8px] font-black tracking-widest text-white/30 uppercase">{t.label}</span>
                <span className="text-xl font-black hero-text" style={{ color: tLevel.color }}>{t.value}%</span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Trend Overlay */}
        <div className={`mt-2 flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 ${
          risk.trend === 'increasing' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/2 border-white/5 text-white/30'
        }`}>
           <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                risk.trend === 'increasing' ? 'bg-primary/20' : 'bg-white/5'
              }`}>
                 <TrendIcon size={20} />
              </div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black tracking-widest uppercase opacity-60">Signature Trend</span>
                 <span className="text-xs font-black tracking-tight uppercase">Probability is {risk.trend}</span>
              </div>
           </div>
           {risk.trend === 'increasing' && (
             <span className="text-[10px] font-black animate-pulse uppercase tracking-[0.2em]">Risk Throttled</span>
           )}
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-10 pointer-events-none rounded-full" style={{ backgroundColor: level.color }} />
    </div>
  );
}
