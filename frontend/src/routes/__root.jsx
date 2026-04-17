import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { DataContext } from '../DataContext';
import Header from '../components/Header';
import AlertBar from '../components/AlertBar';
import AIChatBot from '../components/AIChatBot';

const ZONE_NAMES = {
  'Zone A': 'NORTH GRID',
  'Zone B': 'EAST RESERVOIR',
  'Zone C': 'SOUTH LOOP',
  'Zone D': 'WEST PLANT',
  'Zone E': 'CENTRAL TRUNK',
};

function RootComponent() {
  const [data, setData] = useState({ recent: {}, history: [] });
  const [error, setError] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dataRes, histRes] = await Promise.all([
        fetch('http://localhost:5000/api/data'),
        fetch('http://localhost:5000/api/history'),
      ]);
      if (!dataRes.ok || !histRes.ok) throw new Error('Backend unreachable');
      const recent = await dataRes.json();
      const history = await histRes.json();
      setData({ recent, history });
      setError(null);
    } catch (err) {
      setError('Failed to connect to backend simulator');
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <DataContext.Provider value={{ data, voiceEnabled, setVoiceEnabled, ZONE_NAMES }}>
      <div className="min-h-screen relative overflow-hidden selection:bg-primary/30">
        <div className="noise-overlay" />
        <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col gap-8 animate-entrance relative z-10">
          <Header voiceEnabled={voiceEnabled} setVoiceEnabled={setVoiceEnabled} />
          {error ? (
            <div className="glass flex items-center justify-center py-24">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-destructive)' }}>Connection Error</h2>
                <p style={{ color: 'var(--color-muted)' }}>{error}</p>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
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
