'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { BibleSheet } from '../../libs/shared-ui/BibleSheet';

interface BibleContextValue {
  bibleOpen: boolean;
  openBible: () => void;
  closeBible: () => void;
}

const BibleContext = createContext<BibleContextValue | null>(null);

export function BibleProvider({ children }: { children: ReactNode }) {
  const [bibleOpen, setBibleOpen] = useState(false);

  function openBible() {
    setBibleOpen(true);
  }

  function closeBible() {
    setBibleOpen(false);
  }

  return (
    <BibleContext.Provider value={{ bibleOpen, openBible, closeBible }}>
      {children}
      <BibleSheet open={bibleOpen} onClose={closeBible} />
    </BibleContext.Provider>
  );
}

export function useBible() {
  const ctx = useContext(BibleContext);
  if (!ctx) throw new Error('useBible must be used within BibleProvider');
  return ctx;
}
