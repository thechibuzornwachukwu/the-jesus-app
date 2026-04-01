'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera } from 'lucide-react';
import { Avatar } from '../../../../../libs/shared-ui/Avatar';
import { Input } from '../../../../../libs/shared-ui/Input';
import { Button } from '../../../../../libs/shared-ui/Button';
import { updateProfile } from '../../../../../lib/profile/actions';
import { showToast } from '../../../../../libs/shared-ui/Toast';
import type { FullProfile } from '../../../../../libs/profile/types';

interface Props {
  profile: FullProfile;
  returnPath: string;
}

export function EditProfileClient({ profile: initial, returnPath }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [isPublic, setIsPublic] = useState(initial.is_public);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: form });
    if (res.ok) {
      const { avatarUrl: url } = await res.json();
      setAvatarUrl(url);
      showToast('Avatar updated');
    }
    e.target.value = '';
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    form.set('is_public', isPublic ? 'true' : 'false');
    const result = await updateProfile(form);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      showToast('Profile saved');
      router.push(returnPath);
    }
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text)',
            display: 'flex',
            alignItems: 'center',
            padding: 'var(--space-1)',
          }}
        >
          <ArrowLeft size={22} />
        </button>
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
          }}
        >
          Edit Profile
        </h1>
      </div>

      {/* Avatar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'var(--space-6) var(--space-4) var(--space-4)',
          gap: 'var(--space-2)',
        }}
      >
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Change avatar"
          style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <div
            style={{
              borderRadius: 'var(--radius-full)',
              outline: '2px solid var(--color-accent)',
              outlineOffset: 2,
              lineHeight: 0,
            }}
          >
            <Avatar src={avatarUrl} name={initial.username} size={88} />
          </div>
          <span
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-accent)',
              border: '2px solid var(--color-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent-text)',
            }}
          >
            <Camera size={13} />
          </span>
        </button>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Tap to change photo
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          padding: '0 var(--space-4) var(--space-8)',
        }}
      >
        <Input
          name="username"
          label="Username"
          defaultValue={initial.username}
          required
          placeholder="your_username"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Bio
          </label>
          <textarea
            name="bio"
            defaultValue={initial.bio ?? ''}
            placeholder="A short faith bio…"
            maxLength={200}
            rows={3}
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-base)',
              resize: 'vertical',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--line-height-normal)',
              outline: 'none',
            }}
          />
        </div>

        {/* Public profile toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', fontWeight: 'var(--font-weight-medium)' }}>
              Public profile
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Anyone can see your posts
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic((v) => !v)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 'var(--radius-full)',
              background: isPublic ? 'var(--color-accent)' : 'var(--color-border)',
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
                left: isPublic ? 23 : 3,
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
            {error}
          </p>
        )}

        <Button type="submit" loading={saving} style={{ marginTop: 'var(--space-2)' }}>
          Save Changes
        </Button>
      </form>
    </div>
  );
}
