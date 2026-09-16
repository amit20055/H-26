import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { DataContext } from '../DataContext';
import Header from '../components/Header';
import AlertBar from '../components/AlertBar';
import AIChatBot from '../components/AIChatBot';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const ZONE_NAMES = {
  'Zone A': 'NORTH GRID',
  'Zone B': 'EAST RESERVOIR',
  'Zone C': 'SOUTH LOOP',
  'Zone D': 'WEST PLANT',
  'Zone E': 'CENTRAL TRUNK',
};

const ZONES_LIST = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"];
const simHistoryStore = { "Zone A": [], "Zone B": [], "Zone C": [], "Zone D": [], "Zone E": [] };
let simEventId = 1;

function generateSimulatedData() {
  const now = new Date();
  const timestamp = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');

  const recent = {};

  ZONES_LIST.forEach((zone) => {
    let p = 2.4 + Math.random() * 1.0;
    let f = 80 + Math.random() * 45;
    let isAnomaly = false;

    // ~2% chance for simulated anomaly
    if (Math.random() < 0.02) {
      isAnomaly = true;
      p = 4.2 + Math.random() * 0.6;
      f = 20 + Math.random() * 15;
    }

    const confidence = isAnomaly ? 38.5 : 97.4;
    const dataPoint = {
      id: simEventId++,
      timestamp,
      zone,
      pressure: parseFloat(p.toFixed(2)),
      flow_rate: parseFloat(f.toFixed(2)),
      is_anomaly: isAnomaly,
      confidence
    };

    recent[zone] = dataPoint;
    if (!simHistoryStore[zone]) simHistoryStore[zone] = [];
    simHistoryStore[zone].push(dataPoint);
    if (simHistoryStore[zone].length > 100) simHistoryStore[zone].shift();
  });

  const history = [];
  ZONES_LIST.forEach(z => history.push(...(simHistoryStore[z] || [])));
  history.sort((a, b) => a.id - b.id);

  return { recent, history };
}

function RootComponent() {
  const [data, setData] = useState({ recent: {}, history: [] });
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec timeout

      const [dataRes, histRes] = await Promise.all([
        fetch(`${API_URL}/api/data`, { signal: controller.signal }),
        fetch(`${API_URL}/api/history`, { signal: controller.signal }),
      ]);
      clearTimeout(timeoutId);

      if (!dataRes.ok || !histRes.ok) throw new Error('Backend unreachable');
      const recent = await dataRes.json();
      const history = await histRes.json();

      setData({ recent, history });
      setIsBackendConnected(true);
    } catch (err) {
      // Backend unreachable: seamless fallback to client-side simulator
      setIsBackendConnected(false);
      const simulated = generateSimulatedData();
      setData(simulated);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <DataContext.Provider 
      value={{ 
        data, 
        voiceEnabled, 
        setVoiceEnabled, 
        ZONE_NAMES, 
        isBackendConnected,
        retryConnection: fetchData 
      }}
    >
      <div className="min-h-screen relative overflow-hidden selection:bg-primary/30">
        <div className="noise-overlay" />
        <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col gap-8 animate-entrance relative z-10">
          <Header voiceEnabled={voiceEnabled} setVoiceEnabled={setVoiceEnabled} />
          <Outlet />
          <AlertBar data={data} voiceEnabled={voiceEnabled} />
        </div>
        {/* Global floating chatbot — outside scroll container */}
        <AIChatBot />
      </div>
    </DataContext.Provider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="glass p-12 text-center">
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-destructive)' }}>404 — Not Found</h2>
      <p style={{ color: 'var(--color-muted)' }}>The requested pipeline route does not exist.</p>
    </div>
  ),
});
