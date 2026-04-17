const ALL_ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'];

const ZONE_POSITIONS = {
  'Zone A': { x: 120, y: 30, letter: 'A' },
  'Zone B': { x: 230, y: 70, letter: 'B' },
  'Zone C': { x: 220, y: 160, letter: 'C' },
  'Zone D': { x: 80, y: 200, letter: 'D' },
  'Zone E': { x: 40, y: 110, letter: 'E' },
};

const HUB_POS = { x: 140, y: 120 };

export default function NetworkTopology({ data }) {
  if (!data?.recent) return null;

  return (
    <div className="glass-aurora p-10 rounded-[40px] h-[400px] flex flex-col lg:flex-row items-center gap-12 bg-navy relative overflow-hidden group border border-white/10">
      {/* Topology Header (Top corner) */}
      <div className="absolute top-8 left-10 flex items-center gap-3">
         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a4.8 4.8 0 0 1 0 8.4"/><path d="M19.8 4.2a9.6 9.6 0 0 1 0 15.6"/><path d="M7.8 16.2a4.8 4.8 0 0 1 0-8.4"/><path d="M4.2 19.8a9.6 9.6 0 0 1 0-15.6"/></svg>
         </div>
         <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Live Infrastructure</span>
            <h3 className="text-xl font-black hero-text text-white">Network Topology</h3>
         </div>
      </div>

      <div className="absolute top-8 right-10 flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/30">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[9px] font-black text-success tracking-widest uppercase">All Links Up</span>
      </div>

      {/* Main SVG Graph */}
      <div className="flex-1 w-full flex items-center justify-center py-12">
        <svg viewBox="0 0 280 240" className="w-full max-w-[400px] drop-shadow-[0_0_30px_rgba(77,212,168,0.1)] overflow-visible">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            {/* Packet path markers */}
            <circle id="packet" r="2.5" fill="var(--color-success)" filter="url(#glow)" />
          </defs>

          {/* Spokes (Connections to Hub) */}
          {ALL_ZONES.map(zone => {
            const pos = ZONE_POSITIONS[zone];
            const isAnomaly = data.recent[zone]?.is_anomaly;
            const pathId = `path-${zone.replace(' ', '')}`;
            
            return (
              <g key={zone}>
                <path 
                  id={pathId}
                  d={`M${HUB_POS.x},${HUB_POS.y} L${pos.x},${pos.y}`} 
                  stroke={isAnomaly ? 'var(--color-primary)' : 'var(--color-info)'} 
                  strokeWidth="2" 
                  strokeOpacity="0.2"
                  strokeDasharray="4 4"
                />
                
                {/* Data Packets flowing outward */}
                <use href="#packet">
                  <animateMotion 
                    dur={`${2 + Math.random() * 2}s`} 
                    repeatCount="indefinite" 
                    path={`M${HUB_POS.x},${HUB_POS.y} L${pos.x},${pos.y}`} 
                  />
                </use>
              </g>
            );
          })}

          {/* Remote Nodes */}
          {ALL_ZONES.map(zone => {
            const pos = ZONE_POSITIONS[zone];
            const isAnomaly = data.recent[zone]?.is_anomaly;
            const color = isAnomaly ? 'var(--color-primary)' : 'var(--color-accent)';
            
            return (
              <g key={zone} className="transition-transform duration-500 hover:scale-110">
                <circle cx={pos.x} cy={pos.y} r="15" fill="var(--color-navy)" stroke={color} strokeWidth="2" strokeOpacity="1" />
                <text x={pos.x} y={pos.y} textAnchor="middle" dy="0.35em" fill="white" fontSize="9" fontWeight="900" fontFamily="Outfit">{pos.letter}</text>
                <text x={pos.x} y={pos.y + 25} textAnchor="middle" fill="white" fillOpacity="0.3" fontSize="6" fontWeight="800" uppercase tracking-widest>{zone.toUpperCase()}</text>
              </g>
            );
          })}

          {/* Central Hub */}
          <g filter="url(#glow)">
            <circle cx={HUB_POS.x} cy={HUB_POS.y} r="22" fill="var(--color-navy)" stroke="var(--color-primary)" strokeWidth="3" />
            <circle cx={HUB_POS.x} cy={HUB_POS.y} r="12" fill="var(--color-primary)" opacity="0.4" className="animate-pulse" />
            <circle cx={HUB_POS.x} cy={HUB_POS.y} r="5" fill="white" />
          </g>
        </svg>
      </div>

      {/* Sidebar Metrics */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
         {[
           { label: 'Hub', val: '1', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
           { label: 'Nodes', val: '5', icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
           { label: 'Links', val: '5/5', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
         ].map((stat, i) => (
           <div key={i} className="glass-aurora p-5 rounded-2xl flex items-center justify-between border-white/5 transition-colors hover:bg-white/10 group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info group-hover:bg-info group-hover:text-navy transition-all">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={stat.icon}/></svg>
                 </div>
                 <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">{stat.label}</span>
              </div>
              <span className="text-2xl font-black hero-text text-white">{stat.val}</span>
           </div>
         ))}
      </div>

      {/* Decorative backdrop */}
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
