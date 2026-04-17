import React, { useEffect, useState } from 'react';
import { AlertOctagon, X, Search, Mail } from 'lucide-react';

const ZONE_EMAILS = {
  'Zone A': 'rishabh79singh@gmail.com',
  'Zone B': 'dubeyamitesh024@gmail.com',
  'Zone C': 'aniketchandel8471@gmail.com',
  'Zone D': 'amitprajapti0458@gmail.com',
  'Zone E': 'sbnpcil@gmail.com'
};

const ZONE_COORDS = {
  'Zone A': 'Lat 28.6139; Lng 77.2090',
  'Zone B': 'Lat 28.5355; Lng 77.2410',
  'Zone C': 'Lat 28.6692; Lng 77.2273',
  'Zone D': 'Lat 28.6324; Lng 77.1131',
  'Zone E': 'Lat 28.6219; Lng 77.3060',
};

function AlertPopup({ data, globalView, selectedZone, voiceEnabled }) {
  const [visible, setVisible]           = useState(false);
  const [emailVisible, setEmailVisible] = useState(false);   // independent 3-sec toast
  const [lastAlertId, setLastAlertId]   = useState(null);
  const [alertContent, setAlertContent] = useState(null);

  // Cancel voice when disabled
  useEffect(() => {
    if (!voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [voiceEnabled]);

  useEffect(() => {
    if (!data || !data.recent) return;

    let anomalyZone = null;
    let anomalyData = null;

    if (globalView) {
      for (const [zone, readings] of Object.entries(data.recent)) {
        if (readings.is_anomaly && readings.id !== lastAlertId) {
          anomalyZone = zone;
          anomalyData = readings;
          break;
        }
      }
    } else if (selectedZone && data.recent[selectedZone]) {
      const readings = data.recent[selectedZone];
      if (readings.is_anomaly && readings.id !== lastAlertId) {
        anomalyZone = selectedZone;
        anomalyData = readings;
      }
    }

    if (anomalyZone && anomalyData) {
      setVisible(true);            // main banner stays until closed manually
      setEmailVisible(true);       // email toast appears…
      setLastAlertId(anomalyData.id);
      setAlertContent({
        zone:     anomalyZone,
        pressure: anomalyData.pressure,
        flow:     anomalyData.flow_rate,
      });

      if (voiceEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Alert! Anomaly detected in ${anomalyZone}. Immediate inspection required.`
        );
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }

      // Email toast auto-hides after 3 seconds only
      const tEmail = setTimeout(() => setEmailVisible(false), 3000);
      return () => clearTimeout(tEmail);
    }
  }, [data, globalView, selectedZone, lastAlertId, voiceEnabled]);

  return (
    <div className="alert-bar-wrapper">
      {/* ── Main persistent alert banner ── */}
      <div className={`alert-bar ${visible && alertContent ? 'visible' : ''}`}>
        <div className="alert-bar-content">
          <div className="alert-bar-icon">
            <AlertOctagon size={28} color="#FF4444" />
          </div>
          <div className="alert-bar-text">
            <h4>
              Critical: Leak detected in {alertContent?.zone}, Chandigarh — Live location:{' '}
              {ZONE_COORDS[alertContent?.zone] || 'Unknown'}
            </h4>
            <p>
              AI engine detected anomaly: Pressure {alertContent?.pressure?.toFixed(1)} bar | Flow {alertContent?.flow?.toFixed(1)} L/s
            </p>
          </div>
        </div>
        <div className="alert-bar-actions">
          {globalView && (
            <button
              className="back-btn"
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', color: '#fff', borderColor: 'var(--accent-red)' }}
            >
              <Search size={16} style={{ marginRight: '6px', display: 'inline' }} />
              Inspect
            </button>
          )}
          <button className="alert-bar-close" onClick={() => setVisible(false)}>
            <X size={24} />
          </button>
        </div>
      </div>

      {/* ── Small 3-second email toast (bottom-right) ── */}
      <div
        style={{
          position:        'fixed',
          bottom:          '20px',
          right:           '20px',
          backgroundColor: 'rgba(20, 25, 40, 0.95)',
          color:           '#fff',
          padding:         '10px 16px',
          borderRadius:    '10px',
          fontSize:        '0.82rem',
          border:          '1px solid var(--accent-blue)',
          boxShadow:       '0 4px 14px rgba(0,0,0,0.5)',
          transform:       emailVisible && alertContent ? 'translateY(0)' : 'translateY(80px)',
          opacity:         emailVisible && alertContent ? 1 : 0,
          pointerEvents:   emailVisible ? 'auto' : 'none',
          transition:      'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          zIndex:          1000,
          display:         'flex',
          alignItems:      'center',
          gap:             '10px',
          backdropFilter:  'blur(10px)',
          maxWidth:        '340px',
        }}
      >
        <Mail size={15} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
        <span>
          Alert email sent for <strong style={{ color: 'var(--accent-blue)' }}>{alertContent?.zone}</strong>
          {' '}→ {alertContent ? ZONE_EMAILS[alertContent.zone] : ''}
        </span>
      </div>
    </div>
  );
}

export default AlertPopup;
