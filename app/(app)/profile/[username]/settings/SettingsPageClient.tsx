'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Lock, Sliders, Bell, AlertTriangle } from 'lucide-react';
import { Input } from '../../../../../libs/shared-ui/Input';
import { Button } from '../../../../../libs/shared-ui/Button';
import { ChipGroup } from '../../../../../libs/shared-ui';
import {
  changeEmail,
  changePassword,
  updatePrivacy,
  updateContentPreferences,
  unblockUser,
  deleteAccount,
} from '../../../../../lib/profile/actions';
import { createClient } from '../../../../../lib/supabase/client';
import type { FullProfile } from '../../../../../libs/profile/types';

const CATEGORIES = ['Prayer', 'Bible Study', 'Youth', 'Worship', 'Discipleship', 'General'];

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div
        style={{
          background: 'var(--color-surface-high)',
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <span style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center' }}>{icon}</span>
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)' as React.CSSProperties['fontWeight'],
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {title}
        </h3>
      </div>
      <div style={{ padding: 'var(--space-4)' }}>{children}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)', margin: 'var(--space-4) 0' }} />;
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
      <div>
        <p style={{ margin: 0, fontSize: 'var(--font-size-base)', color: 'var(--color-text)' }}>{label}</p>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{description}</p>
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

function Msg({ text }: { text: string }) {
  const isError = /fail|error|denied/i.test(text);
  return (
    <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: isError ? 'var(--color-error)' : 'var(--color-success)' }}>
      {text}
    </p>
  );
}

interface Props {
  profile: FullProfile;
  blockedUserIds: string[];
}

export function SettingsPageClient({ profile, blockedUserIds: initialBlocked }: Props) {
  const router = useRouter();
  const [emailMsg, setEmailMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [categories, setCategories] = useState<string[]>(profile.content_categories ?? []);
  const [blocked, setBlocked] = useState(initialBlocked);
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
    <div style={{ minHeight: '100%', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'calc(var(--safe-top) + var(--space-3)) var(--space-4) var(--space-3)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Back"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', padding: 'var(--space-1)' }}
        >
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          Settings
        </h1>
      </div>

      <div style={{ flex: 1, padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-4))' }}>

        <Section title="Account" icon={<User size={14} />}>
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

        <Section title="Privacy" icon={<Lock size={14} />}>
          <ToggleRow
            label="Public profile"
            description="Others can see your profile"
            checked={isPublic}
            onChange={handlePrivacyToggle}
          />
          {blocked.length > 0 && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                Blocked users
              </p>
              {blocked.map((id) => (
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
                    onClick={async () => { await unblockUser(id); setBlocked((prev) => prev.filter((b) => b !== id)); }}
                    style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)' }}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Content Preferences" icon={<Sliders size={14} />}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
            Select topics you care about
          </p>
          <ChipGroup options={CATEGORIES} value={categories} onChange={handleCategoryChange} mode="multi" softActive />
        </Section>

        <Section title="Notifications" icon={<Bell size={14} />}>
          <Button variant="ghost" onClick={handleEnablePush}>Enable push notifications</Button>
          {pushMsg && <Msg text={pushMsg} />}
        </Section>

        <Section title="Danger Zone" icon={<AlertTriangle size={14} />}>
          <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error)', marginBottom: 'var(--space-2)' }}>
              Delete account — type <strong>DELETE</strong> to confirm
            </p>
            <Input label="" placeholder="DELETE" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
            <Button
              onClick={deleteAccount as () => void}
              disabled={deleteConfirm !== 'DELETE'}
              style={{
                marginTop: 'var(--space-3)',
                background: 'rgba(248,113,113,0.1)',
                color: 'var(--color-error)',
                opacity: deleteConfirm !== 'DELETE' ? 0.4 : 1,
                border: '1px solid rgba(248,113,113,0.3)',
              }}
            >
              Permanently Delete Account
            </Button>
          </div>
        </Section>

      </div>
    </div>
  );
}
