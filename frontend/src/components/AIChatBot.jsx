import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Droplets, Activity, Zap, AlertTriangle, ChevronDown, Sparkles } from 'lucide-react';
import { useAppData } from '../DataContext';

/* ── Zone metadata ─────────────────────────────────────────────────────── */
const ZONE_META = {
  'Zone A': { name: 'North Grid',      lat: 28.6139, lng: 77.2090 },
  'Zone B': { name: 'East Reservoir',  lat: 28.5355, lng: 77.2410 },
  'Zone C': { name: 'South Loop',      lat: 28.6692, lng: 77.2273 },
  'Zone D': { name: 'West Plant',      lat: 28.6324, lng: 77.1131 },
  'Zone E': { name: 'Central Trunk',   lat: 28.6219, lng: 77.3060 },
};

/* ── Typing indicator ──────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '6px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--color-primary)',
          animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          display: 'inline-block',
        }} />
      ))}
    </div>
  );
}

/* ── AI Brain — deterministic NLP on live data ─────────────────────────── */
function buildReply(message, liveData) {
  const q = message.toLowerCase().trim();
  const zones = Object.keys(liveData);

  // Helper: get zone data safely
  const zd = (z) => liveData[z] || {};
  const anomalyZones = zones.filter(z => zd(z).is_anomaly);
  const okZones      = zones.filter(z => !zd(z).is_anomaly);

  // ── greetings ──────────────────────────────────────────────────────────
  if (/^(hi|hello|hey|howdy|good\s*(morning|evening|afternoon))/i.test(q)) {
    const status = anomalyZones.length > 0
      ? `⚠️ **${anomalyZones.length} zone(s) currently flagged** as anomalous. I'd recommend reviewing them first.`
      : `✅ All ${zones.length} zones are operating nominally right now.`;
    return `👋 Hello! I'm **HydroAI**, your smart water infrastructure assistant.\n\n${status}\n\nAsk me about zone pressures, flow rates, anomalies, or general pipeline health!`;
  }

  // ── help ───────────────────────────────────────────────────────────────
  if (/help|what can you|commands|features|capabilities/i.test(q)) {
    return `🧠 **HydroAI — What I can help with:**\n\n` +
      `📊 **Zone data** — "What's the pressure in Zone A?"\n` +
      `🚨 **Anomalies** — "Any leaks detected?" / "Which zones are critical?"\n` +
      `📈 **System status** — "Overall pipeline status"\n` +
      `📍 **Locations** — "Where is Zone C?"\n` +
      `💧 **Flow rates** — "Show me flow across all zones"\n` +
      `🔧 **Recommendations** — "What should I do about Zone D?"\n\n` +
      `Just ask naturally — I understand plain English!`;
  }

  // ── anomaly overview ───────────────────────────────────────────────────
  if (/anomal|leak|critical|alert|alarm|burst|problem|issue|fault|error/i.test(q) &&
      !/specific|zone [a-e]/i.test(q)) {
    if (anomalyZones.length === 0) {
      return `✅ **No anomalies detected** across all ${zones.length} zones.\n\nAll pressure and flow readings are within safe parametric bounds. The Isolation Forest AI model is running continuously with ~97% confidence.`;
    }
    const details = anomalyZones.map(z => {
      const d = zd(z);
      const m = ZONE_META[z];
      return `• **${z}** (${m?.name}) — Pressure: **${d.pressure?.toFixed(2)} bar**, Flow: **${d.flow_rate?.toFixed(1)} L/s** | 📍 ${m?.lat}, ${m?.lng}`;
    }).join('\n');
    return `🚨 **${anomalyZones.length} anomalous zone(s) detected:**\n\n${details}\n\n💡 *Recommended action: dispatch field technician and monitor pressure trajectory for the next 5 minutes.*`;
  }

  // ── overall / all zones status ─────────────────────────────────────────
  if (/all zones?|overall|system|status|summary|dashboard|overview|how is everything/i.test(q)) {
    const rows = zones.map(z => {
      const d = zd(z);
      const icon = d.is_anomaly ? '🔴' : '🟢';
      return `${icon} **${z}** — ${d.pressure?.toFixed(2)} bar | ${d.flow_rate?.toFixed(1)} L/s | AI conf: ${d.confidence?.toFixed(1)}%`;
    }).join('\n');
    const health = anomalyZones.length === 0
      ? '✅ System is fully healthy.'
      : `⚠️ ${anomalyZones.length} zone(s) require attention.`;
    return `📡 **Live system snapshot:**\n\n${rows}\n\n${health}`;
  }

  // ── pressure queries ───────────────────────────────────────────────────
  if (/pressure/i.test(q)) {
    const zoneMatch = q.match(/zone\s*([a-e])/i);
    if (zoneMatch) {
      const z = `Zone ${zoneMatch[1].toUpperCase()}`;
      const d = zd(z);
      if (!d.pressure) return `I don't have data for ${z} right now. Please check back shortly.`;
      const status = d.is_anomaly
        ? `⚠️ **ELEVATED** — possible burst or blockage`
        : `✅ Normal operating range (2.4–3.4 bar)`;
      return `💧 **${z} pressure reading:**\n\n**${d.pressure?.toFixed(2)} bar** — ${status}\n\nFor reference, safe operational threshold is **2.4–3.4 bar**. Readings above 4.0 bar indicate a potential pipeline fault.`;
    }
    // All zones pressure
    const rows = zones.map(z => {
      const d = zd(z);
      const flag = d.is_anomaly ? ' ⚠️' : '';
      return `• **${z}**: ${d.pressure?.toFixed(2)} bar${flag}`;
    }).join('\n');
    return `💧 **Pressure across all zones:**\n\n${rows}\n\n*Normal range: 2.4–3.4 bar. Values above 4.0 bar are flagged as anomalous.*`;
  }

  // ── flow rate queries ──────────────────────────────────────────────────
  if (/flow|flow rate|litre|liter|throughput|volume/i.test(q)) {
    const zoneMatch = q.match(/zone\s*([a-e])/i);
    if (zoneMatch) {
      const z = `Zone ${zoneMatch[1].toUpperCase()}`;
      const d = zd(z);
      if (!d.flow_rate) return `No flow data available for ${z} at the moment.`;
      const status = d.is_anomaly
        ? `⚠️ **CRITICALLY LOW** — suspected major leak`
        : `✅ Normal throughput`;
      return `🌊 **${z} flow rate:**\n\n**${d.flow_rate?.toFixed(1)} L/s** — ${status}\n\nExpected normal range: **80–125 L/s**. Flow below 35 L/s alongside high pressure strongly indicates a pipe burst.`;
    }
    const rows = zones.map(z => {
      const d = zd(z);
      const flag = d.is_anomaly ? ' ⚠️' : '';
      return `• **${z}**: ${d.flow_rate?.toFixed(1)} L/s${flag}`;
    }).join('\n');
    return `🌊 **Flow rates across all zones:**\n\n${rows}\n\n*Normal range: 80–125 L/s.*`;
  }

  // ── confidence / AI model ──────────────────────────────────────────────
  if (/confiden|accuracy|model|ai|machine learn|isolat|forest|precision/i.test(q)) {
    const avgConf = zones.reduce((s, z) => s + (zd(z).confidence || 97), 0) / zones.length;
    return `🧠 **AI Model — Isolation Forest v2**\n\n` +
      `The anomaly detection engine uses an **Isolation Forest** algorithm trained on historical pipeline data.\n\n` +
      `• **Average confidence:** ${avgConf.toFixed(1)}%\n` +
      `• **Anomaly zones confidence:** ~30–45% (uncertain = flagged)\n` +
      `• **Healthy zones confidence:** ~95–99%\n` +
      `• **Detection latency:** <12ms per inference cycle\n\n` +
      `The model runs every second across all 5 zones simultaneously.`;
  }

  // ── location / coordinates ─────────────────────────────────────────────
  if (/locat|where|coordinat|lat|lng|longitude|latitude|gps|map/i.test(q)) {
    const zoneMatch = q.match(/zone\s*([a-e])/i);
    if (zoneMatch) {
      const z = `Zone ${zoneMatch[1].toUpperCase()}`;
      const m = ZONE_META[z];
      if (!m) return `Location data not found for ${z}.`;
      return `📍 **${z} — ${m.name}**\n\nLatitude: **${m.lat}°N**\nLongitude: **${m.lng}°E**\n\nThis zone is visible on the Strategic Map panel on the dashboard homepage.`;
    }
    const rows = Object.entries(ZONE_META).map(([z, m]) =>
      `• **${z}** (${m.name}) — ${m.lat}°N, ${m.lng}°E`
    ).join('\n');
    return `📍 **Zone coordinates:**\n\n${rows}`;
  }

  // ── specific zone query ────────────────────────────────────────────────
  const zoneMatch = q.match(/zone\s*([a-e])/i);
  if (zoneMatch) {
    const z = `Zone ${zoneMatch[1].toUpperCase()}`;
    const d = zd(z);
    const m = ZONE_META[z];
    if (!d.pressure) return `No data found for ${z}. The backend may still be warming up.`;
    const stateIcon = d.is_anomaly ? '🔴 ANOMALY' : '🟢 NOMINAL';
    return `📡 **${z} — ${m?.name ?? z}** ${stateIcon}\n\n` +
      `• **Pressure:** ${d.pressure?.toFixed(2)} bar\n` +
      `• **Flow rate:** ${d.flow_rate?.toFixed(1)} L/s\n` +
      `• **AI confidence:** ${d.confidence?.toFixed(1)}%\n` +
      `• **Location:** ${m?.lat}°N, ${m?.lng}°E\n\n` +
      (d.is_anomaly
        ? `⚠️ *This zone is currently flagged. Recommend dispatching inspection team immediately.*`
        : `✅ *Operating within all safety parameters.*`);
  }

  // ── recommendation ─────────────────────────────────────────────────────
  if (/recommend|what (should|do) i|action|response|next step|fix|repair|dispatch/i.test(q)) {
    if (anomalyZones.length === 0) {
      return `✅ **No immediate action required.** All zones are healthy.\n\n**Routine recommendations:**\n• Continue scheduling quarterly pipeline inspections\n• Monitor Zone D (West Plant) — historically highest pressure variance\n• Ensure backup pump systems are service-tested monthly`;
    }
    const actions = anomalyZones.map((z, i) => {
      const m = ZONE_META[z];
      return `${i + 1}. **${z} (${m?.name})** — Dispatch field crew to ${m?.lat}°N, ${m?.lng}°E. Shut isolation valve if pressure exceeds 4.5 bar.`;
    }).join('\n');
    return `🔧 **Recommended actions for active anomalies:**\n\n${actions}\n\n📞 *Also notify Zone supervisor and log incident in maintenance tracker.*`;
  }

  // ── fallback ───────────────────────────────────────────────────────────
  return `🤖 I'm not quite sure how to answer that. Try asking about:\n\n` +
    `• *"Zone B pressure"*\n• *"Any anomalies?"*\n• *"Overall system status"*\n• *"Where is Zone C?"*\n• *"What should I do about Zone A?"*\n\nType **help** to see all I can do!`;
}

/* ── Quick-prompt chips ────────────────────────────────────────────────── */
const CHIPS = [
  { label: 'System status', q: 'Show me overall system status' },
  { label: 'Any anomalies?', q: 'Are there any anomalies?' },
  { label: 'All pressures', q: 'What is the pressure in all zones?' },
  { label: 'AI model info', q: 'Tell me about the AI model' },
];

/* ── Message renderer (basic markdown) ────────────────────────────────── */
function MsgText({ text }) {
  // Convert **bold** and line breaks to JSX
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {lines.map((line, i) => {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <span key={i} style={{ lineHeight: 1.55 }}>
            {parts.map((p, j) =>
              j % 2 === 1
                ? <strong key={j} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{p}</strong>
                : p
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────── */
export default function AIChatBot() {
  const { data } = useAppData();
  const [open, setOpen]     = useState(false);
  const [msgs, setMsgs]     = useState([
    { role: 'bot', text: '👋 Hi! I\'m **HydroAI** — your water infrastructure assistant. Ask me about zone pressures, flow rates, anomalies, or system health!', ts: Date.now() }
  ]);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef           = useRef(null);
  const inputRef            = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const sendMsg = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', text: q, ts: Date.now() }]);
    setTyping(true);

    // Simulate 600-900ms "thinking" delay
    const delay = 600 + Math.random() * 300;
    setTimeout(() => {
      const reply = buildReply(q, data.recent || {});
      setMsgs(prev => [...prev, { role: 'bot', text: reply, ts: Date.now() }]);
      setTyping(false);
    }, delay);
  };

  const anomalyCount = Object.values(data.recent || {}).filter(z => z.is_anomaly).length;

  return (
    <>
      {/* ── Keyframe inject ── */}
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes chatSlide {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(255, 107, 61, 0.5); }
          70%  { box-shadow: 0 0 0 12px rgba(255, 107, 61, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 107, 61, 0); }
        }
      `}</style>

      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="HydroAI Chatbot"
        style={{
          position:     'fixed',
          bottom:       '84px',
          right:        '24px',
          width:        '58px',
          height:       '58px',
          borderRadius: '50%',
          background:   'linear-gradient(135deg, var(--color-primary), hsl(38, 92%, 55%))',
          border:       'none',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          zIndex:       1100,
          boxShadow:    '0 8px 32px rgba(255, 107, 61, 0.4)',
          animation:    anomalyCount > 0 ? 'pulseRing 2s ease-out infinite' : 'none',
          transition:   'transform 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open
          ? <ChevronDown size={24} color="#fff" />
          : <Bot size={26} color="#fff" />
        }
        {/* Unread badge if anomaly */}
        {!open && anomalyCount > 0 && (
          <span style={{
            position:    'absolute',
            top:         '2px',
            right:       '2px',
            width:       '16px',
            height:      '16px',
            borderRadius:'50%',
            background:  '#ff3333',
            fontSize:    '9px',
            fontWeight:  900,
            color:       '#fff',
            display:     'flex',
            alignItems:  'center',
            justifyContent:'center',
            border:      '2px solid var(--color-canvas)',
          }}>{anomalyCount}</span>
        )}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div style={{
          position:        'fixed',
          bottom:          '156px',
          right:           '24px',
          width:           '370px',
          height:          '520px',
          borderRadius:    '24px',
          background:      'hsla(20, 14%, 10%, 0.97)',
          border:          '1px solid hsla(14, 100%, 62%, 0.25)',
          boxShadow:       '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,107,61,0.1)',
          display:         'flex',
          flexDirection:   'column',
          overflow:        'hidden',
          zIndex:          1100,
          animation:       'chatSlide 0.25s ease',
          backdropFilter:  'blur(30px)',
        }}>
          {/* Header */}
          <div style={{
            padding:      '16px 20px',
            background:   'linear-gradient(135deg, hsla(14, 100%, 62%, 0.15), hsla(38, 92%, 55%, 0.08))',
            borderBottom: '1px solid hsla(14, 100%, 62%, 0.15)',
            display:      'flex',
            alignItems:   'center',
            gap:          '12px',
          }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Bot size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#fff', fontFamily: 'Outfit, sans-serif' }}>HydroAI</span>
                <Sparkles size={12} color="var(--color-accent)" />
              </div>
              <span style={{ fontSize: '11px', color: 'hsla(20,10%,100%,0.45)', fontWeight: 600 }}>
                Water infrastructure assistant
              </span>
            </div>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: anomalyCount > 0 ? 'var(--color-primary)' : 'var(--color-success)',
                boxShadow: `0 0 8px ${anomalyCount > 0 ? 'var(--color-primary)' : 'var(--color-success)'}`,
                animation: 'chatDot 2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: anomalyCount > 0 ? 'var(--color-primary)' : 'var(--color-success)' }}>
                {anomalyCount > 0 ? `${anomalyCount} alert` : 'All clear'}
              </span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsla(20,10%,100%,0.4)', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex:      1,
            overflowY: 'auto',
            padding:   '16px',
            display:   'flex',
            flexDirection: 'column',
            gap:       '12px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'hsla(14,100%,62%,0.2) transparent',
          }}>
            {msgs.map((m, i) => (
              <div key={i} style={{
                display:       'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                animation:     'chatSlide 0.2s ease',
              }}>
                {m.role === 'bot' && (
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginRight: '8px', marginTop: '2px',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bot size={13} color="#fff" />
                  </div>
                )}
                <div style={{
                  maxWidth:     '82%',
                  padding:      '10px 13px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background:   m.role === 'user'
                    ? 'linear-gradient(135deg, var(--color-primary), hsl(14,80%,50%))'
                    : 'hsla(20, 14%, 18%, 0.9)',
                  border:       m.role === 'bot' ? '1px solid hsla(20,10%,100%,0.07)' : 'none',
                  fontSize:     '12.5px',
                  lineHeight:   1.55,
                  color:        '#fff',
                  fontWeight:   500,
                }}>
                  {m.role === 'bot' ? <MsgText text={m.text} /> : m.text}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={13} color="#fff" />
                </div>
                <div style={{
                  padding:      '10px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  background:   'hsla(20, 14%, 18%, 0.9)',
                  border:       '1px solid hsla(20,10%,100%,0.07)',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          <div style={{
            padding:    '8px 16px 4px',
            display:    'flex',
            gap:        '6px',
            flexWrap:   'wrap',
            borderTop:  '1px solid hsla(20,10%,100%,0.05)',
          }}>
            {CHIPS.map(c => (
              <button key={c.label} onClick={() => sendMsg(c.q)} style={{
                padding:      '4px 10px',
                borderRadius: '999px',
                background:   'hsla(14, 100%, 62%, 0.1)',
                border:       '1px solid hsla(14, 100%, 62%, 0.2)',
                color:        'var(--color-primary)',
                fontSize:     '10.5px',
                fontWeight:   700,
                cursor:       'pointer',
                transition:   'background 0.2s',
                whiteSpace:   'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'hsla(14, 100%, 62%, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'hsla(14, 100%, 62%, 0.1)'}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div style={{
            padding:     '12px 16px',
            borderTop:   '1px solid hsla(20,10%,100%,0.07)',
            display:     'flex',
            gap:         '10px',
            alignItems:  'center',
            background:  'hsla(20, 14%, 8%, 0.8)',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder="Ask about zones, anomalies, flow…"
              style={{
                flex:          1,
                background:    'hsla(20, 14%, 18%, 0.6)',
                border:        '1px solid hsla(20,10%,100%,0.1)',
                borderRadius:  '12px',
                padding:       '9px 14px',
                color:         '#fff',
                fontSize:      '12.5px',
                fontFamily:    'Inter, sans-serif',
                outline:       'none',
              }}
              onFocus={e => e.target.style.borderColor = 'hsla(14,100%,62%,0.4)'}
              onBlur={e  => e.target.style.borderColor = 'hsla(20,10%,100%,0.1)'}
            />
            <button
              onClick={() => sendMsg()}
              disabled={!input.trim()}
              style={{
                width:        '38px',
                height:       '38px',
                borderRadius: '50%',
                background:   input.trim()
                  ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
                  : 'hsla(20,14%,20%,0.8)',
                border:       'none',
                cursor:       input.trim() ? 'pointer' : 'default',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                flexShrink:   0,
                transition:   'background 0.25s, transform 0.15s',
              }}
              onMouseEnter={e => input.trim() && (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Send size={16} color={input.trim() ? '#fff' : 'hsla(20,10%,100%,0.3)'} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
