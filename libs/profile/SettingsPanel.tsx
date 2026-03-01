'use client';

import React, { useState, useTransition } from 'react';
import { Input } from '../shared-ui/Input';
import { Button } from '../shared-ui/Button';
import { FullScreenModal, ChipGroup } from '../shared-ui';
import {
  changeEmail,
  changePassword,
  updatePrivacy,
  updateContentPreferences,
  unblockUser,
  deleteAccount,
} from '../../lib/profile/actions';
import { createClient } from '../../lib/supabase/client';
import type { FullProfile } from './types';

const CATEGORIES = ['Prayer', 'Bible Study', 'Youth', 'Worship', 'Discipleship', 'General'];

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}

interface SettingsPanelProps {
  profile: FullProfile;
  open: boolean;
  onClose: () => void;
  onProfileUpdate: (p: FullProfile) => void;
  blockedUserIds: string[];
  onUnblock: (id: string) => void;
}

export function SettingsPanel({
  profile,
  open,
  onClose,
  onProfileUpdate,
  blockedUserIds,
  onUnblock,
}: SettingsPanelProps) {
  const [emailMsg, setEmailMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [categories, setCategories] = useState<string[]>(profile.content_categories ?? []);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [pushMsg, setPushMsg] = useState('');
  const [, startTransition] = useTransition();

  function handleCategoryChange(val: string | string[]) {
    const next = val as string[];
    setCategories(next);
    startTransition(async () => { await updateContentPreferences(next); });
  }

  async function handlePrivacyToggle() {
    const next = !isPublic;
    setIsPublic(next);
    await updatePrivacy(next);
    onProfileUpdate({ ...profile, is_public: next });
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (new FormData(e.currentTarget)).get('email') as string;
    const res = await changeEmail(email);
    setEmailMsg(res.success ?? res.error ?? '');
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pw = (new FormData(e.currentTarget)).get('password') as string;
    const res = await changePassword(pw);
    setPwMsg(res.success ?? res.error ?? '');
  }

  async function handleEnablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushMsg('Push notifications are not supported in this browser.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setPushMsg('Permission denied.'); return; }
      const reg = await navigator.serviceWorker.ready;
      const res = await fetch('/api/notifications/vapid-public');
      const { publicKey } = await res.json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });
      const json = sub.toJSON();
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setPushMsg('Push notifications enabled!');
    } catch (err) {
      setPushMsg(`Failed: ${(err as Error).message}`);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/sign-in';
  }

  return (
    <FullScreenModal open={open} onClose={onClose} title="Settings">
      <div style={{ padding: 'var(--space-6) var(--space-4)' }}>

        {/* ── Account ── */}
        <Section title="Account">
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input name="email" label="Change Email" type="email" placeholder="new@email.com" />
            <Button type="submit" variant="ghost">Update Email</Button>
            {emailMsg && <Msg text={emailMsg} />}
          </form>
          <Divider />
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input name="password" label="New Password" type="password" placeholder="Min 8 characters" />
            <Button type="submit" variant="ghost">Update Password</Button>
            {pwMsg && <Msg text={pwMsg} />}
          </form>
        </Section>

        <Divider thick />

        {/* ── Privacy ── */}
        <Section title="Privacy">
          <ToggleRow
            label="Public profile"
            description="Others can see your profile"
            checked={isPublic}
            onChange={handlePrivacyToggle}
          />
          {blockedUserIds.length > 0 && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                Blocked users
              </p>
              {blockedUserIds.map((id) => (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-2) 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', fontFamily: 'monospace' }}>
                    {id.slice(0, 8)}…
                  </span>
                  <Button
                    variant="ghost"
                    onClick={async () => { await unblockUser(id); onUnblock(id); }}
                    style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)' }}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Divider thick />

        {/* ── Preferences ── */}
        <Section title="Content Preferences">
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
            Select topics you care about
          </p>
          <ChipGroup
            options={CATEGORIES}
            value={categories}
            onChange={handleCategoryChange}
            mode="multi"
            softActive
          />
        </Section>

        <Divider thick />

        {/* ── Notifications ── */}
        <Section title="Notifications">
          <Button variant="ghost" onClick={handleEnablePush}>
            Enable push notifications
          </Button>
          {pushMsg && <Msg text={pushMsg} style={{ marginTop: 'var(--space-2)' }} />}
        </Section>

        <Divider thick />

        {/* ── Danger Zone ── */}
        <Section title="Danger Zone">
          <Button variant="ghost" onClick={handleSignOut}>
            Sign Out
          </Button>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent-2)', marginBottom: 'var(--space-2)' }}>
              Delete account  type <strong>DELETE</strong> to confirm
            </p>
            <Input
              label=""
              placeholder="DELETE"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
            <Button
              onClick={deleteAccount as () => void}
              disabled={deleteConfirm !== 'DELETE'}
              style={{
                marginTop: 'var(--space-3)',
                background: 'rgba(139,46,18,0.15)',
                color: 'var(--color-accent-2)',
                opacity: deleteConfirm !== 'DELETE' ? 0.4 : 1,
                border: '1px solid rgba(139,46,18,0.3)',
              }}
            >
              Permanently Delete Account
            </Button>
          </div>
        </Section>

      </div>
    </FullScreenModal>
  );
}

// ── Small helpers ──────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <h3
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-semibold)' as React.CSSProperties['fontWeight'],
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--letter-spacing-wide)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Divider({ thick }: { thick?: boolean }) {
  return (
    <div
      style={{
        height: thick ? 1 : 1,
        background: 'var(--color-border)',
        margin: `var(--space-6) 0`,
      }}
    />
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
      <div>
        <p style={{ margin: 0, fontSize: 'var(--font-size-base)', color: 'var(--color-text)' }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {description}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        style={{
          width: 44,
          height: 24,
          borderRadius: 'var(--radius-full)',
          background: checked ? 'var(--color-accent)' : 'var(--color-border)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'block',
            width: 18,
            height: 18,
            borderRadius: 'var(--radius-full)',
            background: '#fff',
            position: 'absolute',
            top: 3,
            left: checked ? 23 : 3,
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  );
}

function Msg({ text, style }: { text: string; style?: React.CSSProperties }) {
  const isError = text.toLowerCase().includes('fail') || text.toLowerCase().includes('error') || text.toLowerCase().includes('denied');
  return (
    <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: isError ? 'var(--color-error)' : 'var(--color-success)', ...style }}>
      {text}
    </p>
  );
}
