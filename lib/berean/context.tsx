'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { SpiritualGuide } from '../../libs/learn/SpiritualGuide';

interface BereanContextValue {
  open: boolean;
  openBerean: (seedMessage?: string) => void;
  closeBerean: () => void;
}

const BereanContext = createContext<BereanContextValue | null>(null);

export function BereanProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<{ text: string; key: number }>({ text: '', key: 0 });

  function openBerean(seedMessage?: string) {
    if (seedMessage) {
      setSeed((prev) => ({ text: seedMessage, key: prev.key + 1 }));
    }
    setOpen(true);
  }

  function closeBerean() {
    setOpen(false);
  }

  return (
    <BereanContext.Provider value={{ open, openBerean, closeBerean }}>
      {children}
      <SpiritualGuide
        externalOpen={open}
        onExternalClose={closeBerean}
        seedMessage={seed.text}
        seedKey={seed.key}
      />
    </BereanContext.Provider>
  );
}

export function useBerean() {
  const ctx = useContext(BereanContext);
  if (!ctx) throw new Error('useBerean must be used within BereanProvider');
  return ctx;
}
