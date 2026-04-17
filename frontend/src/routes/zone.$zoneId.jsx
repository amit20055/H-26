import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Zap, ShieldCheck, Droplets, Activity, Brain } from 'lucide-react';
import { useAppData } from '../DataContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import WaterLossCalc from '../components/WaterLossCalc';
import RootCauseCard from '../components/RootCauseCard';
import AIBreakdown from '../components/AIBreakdown';
import RiskGauge from '../components/RiskGauge';
import useCountUp from '../hooks/useCountUp';

const ZONE_NAMES = {
  'Zone A': 'North Grid',
  'Zone B': 'East Reservoir',
  'Zone C': 'South Loop',
  'Zone D': 'West Plant',
  'Zone E': 'Central Trunk',
};
const ALL_ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'];

function ZoneDetailComponent() {
  const { zoneId } = Route.useParams();
  const { data } = useAppData();
  const navigate = useNavigate();

  const zoneName = `Zone ${zoneId}`;
  const regionName = ZONE_NAMES[zoneName] || zoneName;
  const latest = data.recent?.[zoneName] || {};
  const history = (data.history || []).filter(h => h.zone === zoneName).slice(-60);
  const isAnomaly = latest.is_anomaly;

  const chartData = history.map(h => ({
    time: h.timestamp?.split(' ')[1] || '',
    Pressure: h.pressure,
    Flow: h.flow_rate,
  }));

  const animatedConfidence = useCountUp(latest.confidence || (isAnomaly ? 34 : 97), 2000, 1);

  return (
    <div className="flex flex-col gap-10 animate-entrance relative z-10">
      {/* Detail Header: Ticket Style */}
      <header className="glass-aurora ticket-cutout p-4 rounded-3xl flex items-center justify-between flex-wrap gap-4 border border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate({ to: '/' })} 
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 bg-white/5 border border-white/10 hover:bg-primary hover:text-white group"
          >
            <ArrowLeft size={24} className="text-white/40 group-hover:text-white" />
          </button>
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase mb-0.5 italic">
               Node Diagnostics
            </span>
            <h1 className="text-3xl font-black hero-text text-white flex items-baseline gap-3">
              Zone {zoneId} <span className="text-lg font-bold text-white/30 tracking-widest uppercase">{regionName}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
          {ALL_ZONES.map(z => {
            const id = z.split(' ')[1];
            const isCurrent = id === zoneId;
            const zAlert = data.recent?.[z]?.is_anomaly;
            return (
              <button
                key={z}
                onClick={() => navigate({ to: '/zone/$zoneId', params: { zoneId: id } })}
                className={`w-10 h-10 rounded-xl text-[10px] font-black flex items-center justify-center transition-all duration-300 ${
                  isCurrent 
                    ? (zAlert ? 'bg-primary text-white' : 'bg-accent text-white') 
                    : 'bg-white/2 text-white/40 hover:bg-white/10 hover:text-white'
                }`}
              >
                {id}
              </button>
            );
          })}
        </div>
      </header>

      {/* Primary Analytics Grid (Moved Graph to be shown first) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Telemetry Chart */}
        <div className="lg:col-span-8 glass-aurora p-5 rounded-3xl flex flex-col gap-4 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black hero-text text-white uppercase italic">Telemetry Stream</h3>
              <p className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase">60-Sample high-fidelity tracking</p>
            </div>
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                  <span className="text-[10px] font-black text-white/50 tracking-widest">Pressure</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                  <span className="text-[10px] font-black text-white/50 tracking-widest">Flow</span>
               </div>
            </div>
          </div>
          
          {/* Reduced graph box height */}
          <div className="h-[160px] w-full mt-2">
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPressure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(20, 10%, 100%, 0.05)" />
                <XAxis dataKey="time" hide />
                <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{ fill: 'hsla(20, 10%, 100%, 0.3)', fontSize: 11, fontWeight: 800 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{ fill: 'hsla(20, 10%, 100%, 0.3)', fontSize: 11, fontWeight: 800 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsla(20, 14%, 7%, 0.95)', border: '1px solid hsla(20, 10%, 100%, 0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }} 
                  itemStyle={{ fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="Pressure" stroke="var(--color-primary)" strokeWidth={4} fill="url(#gPressure)" isAnimationActive={false} />
                <Area yAxisId="right" type="monotone" dataKey="Flow" stroke="var(--color-accent)" strokeWidth={4} fill="url(#gFlow)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnostic Stack - Risk Gauge */}
        <div className="lg:col-span-4 h-full">
           <RiskGauge latest={latest} history={history} />
        </div>
      </div>

      {/* KPI Section: Small Rectangles array under the graph */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Line pressure', value: latest.pressure?.toFixed(2) || '—', unit: 'bar', color: 'var(--color-primary)', Icon: Activity, desc: 'Real-time PSI' },
          { label: 'Flow velocity', value: latest.flow_rate?.toFixed(1) || '—', unit: 'L/s', color: 'var(--color-accent)', Icon: Droplets, desc: 'Throughput' },
          { label: 'Classification', value: isAnomaly ? 'Anomaly' : 'Nominal', unit: '', color: isAnomaly ? 'var(--color-primary)' : 'var(--color-success)', Icon: ShieldCheck, desc: 'Edge inference' },
          { label: 'Precision', value: animatedConfidence, unit: '%', color: 'var(--color-info)', Icon: Brain, desc: 'Confidence' },
        ].map(card => (
          <div key={card.label} className="glass-aurora rounded-2xl p-4 flex items-center justify-between relative group transition-all duration-500 hover:bg-white/5 h-20 border border-white/5">
             <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${card.color}15`, border: `1px solid ${card.color}30` }}>
                    <card.Icon size={18} style={{ color: card.color }} />
                 </div>
                 <div className="flex flex-col gap-0.5 text-left">
                     <span className="text-[9px] font-black tracking-[0.2em] text-white/40">{card.label}</span>
                     <span className="text-[8px] font-bold text-white/30 tracking-widest uppercase">{card.desc}</span>
                 </div>
             </div>
             
             <div className="flex items-baseline gap-1.5 text-right">
               <span className="text-3xl font-black hero-text text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                 {card.value}
               </span>
               <span className="text-xs font-bold text-white/30">{card.unit}</span>
             </div>
          </div>
        ))}
      </div>

      {/* AI Logic (Full Width Horizontal Rectangle) */}
      <div className="glass-aurora p-6 rounded-3xl flex flex-col gap-6 border border-white/5">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white">
               <Brain size={24} />
            </div>
            <h3 className="text-xl font-black hero-text text-white uppercase italic tracking-tight">AI Logic</h3>
         </div>
         <AIBreakdown latest={latest} isAnomaly={isAnomaly} />
      </div>



      {/* Synchrony Tracker */}
      <div className="glass-aurora p-10 rounded-[40px] flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
             <h3 className="text-2xl font-black hero-text text-white uppercase italic">Network Synchrony</h3>
             <p className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase italic">Cross-node heartbeat pulse</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5">
             <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_var(--color-success)]" />
             <span className="text-[10px] font-black text-success tracking-widest uppercase">Grid balanced</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
           {ALL_ZONES.map(z => {
              const zData = data.recent?.[z];
              const zHistory = (data.history || []).filter(h => h.zone === z).slice(-40);
              const zIsAlert = zData?.is_anomaly;
              const zLineColor = zIsAlert ? 'var(--color-primary)' : 'var(--color-success)';
              
              const zChartData = zHistory.map(h => ({ p: h.pressure }));

              return (
                <div key={z} className={`flex flex-col gap-4 p-5 rounded-3xl bg-white/2 border border-white/5 transition-all duration-500 hover:bg-white/10 ${zIsAlert ? 'border-primary/40 bg-primary/5' : ''}`}>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">{z.split(' ')[1]} node</span>
                      <span className={`text-[11px] font-black ${zIsAlert ? 'text-primary' : 'text-success'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {zData?.pressure?.toFixed(2)}
                      </span>
                   </div>
                   <div className="h-16 w-full">
                      <ResponsiveContainer>
                        <LineChart data={zChartData}>
                           <YAxis domain={['auto', 'auto']} hide />
                           <Line type="monotone" dataKey="p" stroke={zLineColor} strokeWidth={3} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              );
           })}
        </div>
      </div>

      {/* Footer Audit Row */}
      <footer className="py-12 border-t border-white/5 text-center px-4">
        <p className="text-[11px] font-black tracking-[0.5em] text-white/20 uppercase">
          Autonomous infrastructure diagnostics � Layer 4 security hardened
        </p>
      </footer>
    </div>
  );
}

export const Route = createFileRoute('/zone/$zoneId')({
  component: ZoneDetailComponent,
});
