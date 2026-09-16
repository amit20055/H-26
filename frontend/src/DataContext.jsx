import { createContext, useContext } from 'react';

export const DataContext = createContext({
  data: { recent: {}, history: [] },
  voiceEnabled: false,
  setVoiceEnabled: () => {},
  ZONE_NAMES: {},
  isBackendConnected: false,
  retryConnection: () => {},
});

export function useAppData() {
  return useContext(DataContext);
}

