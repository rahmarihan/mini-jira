'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface TeamContextValue {
  selectedTeamId: string;
  setSelectedTeamId: (teamId: string) => void;
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [selectedTeamId, setSelectedTeamId] = useState('');

  return (
    <TeamContext.Provider value={{ selectedTeamId, setSelectedTeamId }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamFilter() {
  const ctx = useContext(TeamContext);
  if (!ctx) {
    throw new Error('useTeamFilter must be used within TeamProvider');
  }
  return ctx;
}
