import { useEffect, useState, useRef } from 'react';
import { AlertCircle, X, ChevronRight, Mail } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

const ZONE_EMAILS = {
  'Zone A': 'rishabh79singh@gmail.com',
  'Zone B': 'dubeyamitesh024@gmail.com',
  'Zone C': 'aniketchandel8471@gmail.com',
  'Zone D': 'amitprajapti0458@gmail.com',
  'Zone E': 'sbnpcil@gmail.com'
};

const ZONE_COORDS = {
  'Zone A': 'Latitude 28.6139; Longitude 77.2090',
  'Zone B': 'Latitude 28.5355; Longitude 77.2410',
  'Zone C': 'Latitude 28.6692; Longitude 77.2273',
  'Zone D': 'Latitude 28.6324; Longitude 77.1131',
  'Zone E': 'Latitude 28.6219; Longitude 77.3060'
};

export default function AlertBar({ data, voiceEnabled }) {
  const [visible, setVisible] = useState(false);
  const [emailVisible, setEmailVisible] = useState(false);
  const [alertContent, setAlertContent] = useState(null);
  const lastAlertRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [voiceEnabled]);

  useEffect(() => {
    if (!data?.recent) return;

    for (const [zone, readings] of Object.entries(data.recent)) {
      if (readings.is_anomaly && readings.id !== lastAlertRef.current) {
        lastAlertRef.current = readings.id;
        setAlertContent({ zone, pressure: readings.pressure, flow: readings.flow_rate });
        setVisible(true);
        setEmailVisible(true);

        if (voiceEnabled && 'speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(`Critical alert in ${zone}. Anomaly detected.`);
          u.rate = 1.0;
          window.speechSynthesis.speak(u);
        }

        // Trigger real email dispatch via backend API
        fetch('http://localhost:5000/api/trigger-email', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              zone: zone,
              recipient: ZONE_EMAILS[zone],
              pressure: readings.pressure,
              flow: readings.flow_rate,
              location: ZONE_COORDS[zone]
           })
        }).catch(err => console.error("Email API failed:", err));

        const tEmail = setTimeout(() => setEmailVisible(false), 5000); // Only 5 seconds for email notification
        
        return () => {
           clearTimeout(tEmail);
        };
      }
    }
  }, [data, voiceEnabled]);

  return (
    <>
      <div className="fixed top-8 right-8 z-[100] w-full max-w-[400px] pointer-events-none">
        <div
          className={`glass-aurora pointer-events-auto flex items-stretch gap-0 p-0 rounded-2xl overflow-hidden transition-all duration-700 ease-premium shadow-2xl ${
            visible && alertContent 
              ? 'translate-x-0 opacity-100 scale-100' 
              : 'translate-x-12 opacity-0 scale-95'
          }`}
          style={{ borderColor: 'var(--color-primary)' }}
        >
          {/* Urgent Accent Bar */}
          <div className="w-2 bg-primary animate-pulse" />

          <div className="flex-1 p-5 flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                   <AlertCircle size={18} className="animate-bounce" />
                   <span className="text-[10px] font-black tracking-[0.3em] uppercase italic">Critical Signal</span>
                </div>
                <button 
                  onClick={() => setVisible(false)}
                  className="text-white/20 hover:text-white transition-colors"
                >
                   <X size={16} />
                </button>
             </div>

             <div className="flex flex-col gap-1">
                <h4 className="text-lg font-black hero-text text-white leading-tight">
                   Anomaly in {alertContent?.zone}
                </h4>
                <p className="text-[11px] font-bold text-white/60 uppercase tracking-tighter">
                   Live Location: {alertContent?.zone ? ZONE_COORDS[alertContent.zone] : ''}
                </p>
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-tighter mt-1">
                   System integrity compromised · Pulse {alertContent?.pressure?.toFixed(2)} Bar
                </p>
             </div>

             <button
               onClick={() => {
                  const id = alertContent?.zone?.split(' ')[1];
                  if (id) navigate({ to: '/zone/$zoneId', params: { zoneId: id } });
                  setVisible(false);
               }}
               className="mt-2 flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group/btn"
             >
                <span className="text-[10px] font-black tracking-widest uppercase">Inspect Node</span>
                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>

      {/* Small pop-up at bottom for Email sent notification (5s ONLY) */}
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'rgba(20, 25, 40, 0.95)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          border: '1px solid var(--color-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          transform: emailVisible && alertContent ? 'translateY(0)' : 'translateY(100px)',
          opacity: emailVisible && alertContent ? 1 : 0,
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Mail size={16} color="var(--color-primary)" />
        <span>
          Alert email dispatched to: <strong style={{ color: 'var(--color-primary)' }}>{alertContent ? ZONE_EMAILS[alertContent.zone] : ''}</strong>
        </span>
      </div>
    </>
  );
}
