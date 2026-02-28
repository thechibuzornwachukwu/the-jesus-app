'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

// ── Module-level event bus (zero-context, works across RSC boundaries) ──
type Listener = (item: Omit<ToastItem, 'exiting'>) => void;
const _listeners = new Set<Listener>();
let _nextId = 0;

export function showToast(message: string, type: ToastType = 'info'): void {
  const item = { id: ++_nextId, message, type };
  _listeners.forEach((fn) => fn(item));
}

// ── Icon map ──────────────────────────────────────────────
const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} aria-hidden />,
  error:   <XCircle size={16} aria-hidden />,
  info:    <Info size={16} aria-hidden />,
};

const colors: Record<ToastType, { bg: string; text: string; border: string }> = {
  success: { bg: 'rgba(74,222,128,0.15)', text: 'var(--color-success)', border: 'rgba(74,222,128,0.3)' },
  error:   { bg: 'rgba(248,113,113,0.15)', text: 'var(--color-error)',  border: 'rgba(248,113,113,0.3)' },
  info:    { bg: 'var(--color-surface-high)', text: 'var(--color-text)', border: 'var(--color-border)' },
};

// ── Container component ───────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, 'exiting'>) => {
      setToasts((prev) => [...prev, item]);
      setTimeout(() => dismiss(item.id), 3000);
    },
    [dismiss]
  );

  useEffect(() => {
    _listeners.add(addToast);
    return () => { _listeners.delete(addToast); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      style={{
        position: 'fixed',
        top: 'calc(var(--safe-top) + 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-toast)' as React.CSSProperties['zIndex'],
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
        width: 'min(calc(100vw - 32px), 398px)',
      }}
    >
      {toasts.map((t) => {
        const c = colors[t.type];
        return (
          <div
            key={t.id}
            className={t.exiting ? 'toast-exit' : 'toast-enter'}
            onClick={() => dismiss(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: c.bg,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: 'var(--radius-lg)',
              padding: '12px 16px',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              cursor: 'pointer',
              pointerEvents: 'auto',
              userSelect: 'none',
            }}
          >
            {icons[t.type]}
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
