'use client';

import React from 'react';
import { BottomSheet } from './BottomSheet';
import { BibleReader } from '../bible/BibleReader';

interface BibleSheetProps {
  open: boolean;
  onClose: () => void;
}

export function BibleSheet({ open, onClose }: BibleSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} contentScrollable={false}>
      <BibleReader bottomPadding="16px" />
    </BottomSheet>
  );
}
