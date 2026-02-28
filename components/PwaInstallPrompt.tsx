'use client';

import { useEffect, useState } from 'react';
import { Button } from '../libs/shared-ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt non-intrusively after a short delay
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install The JESUS App"
      style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-3))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - var(--space-8))',
        maxWidth: 398,
        zIndex: 'var(--z-toast)',
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
          Add to Home Screen
        </p>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
          Install for the best experience
        </p>
      </div>
      <Button variant="primary" onClick={handleInstall} style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-2) var(--space-4)' }}>
        Install
      </Button>
      <Button variant="ghost" onClick={handleDismiss} aria-label="Dismiss" style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-2)' }}>
        ✕
      </Button>
    </div>
  );
}
