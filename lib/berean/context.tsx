'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface BereanContextValue {
  bereanOpen: boolean;
  openBerean: (ref?: string) => void;
  closeBerean: () => void;
  pendingRef: string | null;
}

const BereanContext = createContext<BereanContextValue | null>(null);

export function BereanProvider({ children }: { children: ReactNode }) {
  const [bereanOpen, setBereanOpen] = useState(false);
  const [pendingRef, setPendingRef] = useState<string | null>(null);

  function openBerean(ref?: string) {
    setPendingRef(ref ?? null);
    setBereanOpen(true);
  }

  function closeBerean() {
    setBereanOpen(false);
    setPendingRef(null);
  }

  return (
    <BereanContext.Provider value={{ bereanOpen, openBerean, closeBerean, pendingRef }}>
      {children}
    </BereanContext.Provider>
  );
}

export function useBerean() {
  const ctx = useContext(BereanContext);
  if (!ctx) throw new Error('useBerean must be used within BereanProvider');
  return ctx;
}
