'use client';

import React, { useRef } from 'react';
import { Camera, Pencil } from 'lucide-react';
import { Avatar } from '../shared-ui/Avatar';
import { Button } from '../shared-ui/Button';
import type { FullProfile } from './types';

interface ProfileHeaderProps {
  profile: FullProfile;
  onEditClick: () => void;
  onAvatarChange: (url: string) => void;
}

export function ProfileHeader({ profile, onEditClick, onAvatarChange }: ProfileHeaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/api/profile/avatar', { method: 'POST', body: form });
    if (res.ok) {
      const { avatarUrl } = await res.json();
      onAvatarChange(avatarUrl);
    }

    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--space-6) var(--space-6) var(--space-4)',
        gap: 'var(--space-3)',
      }}
    >
      {/* Avatar with camera overlay */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Avatar src={profile.avatar_url} name={profile.username} size={80} />
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Change avatar"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-accent)',
            border: '2px solid var(--color-bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text-inverse)',
            fontSize: '0.75rem',
          }}
        >
          <Camera size={13} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>

      {/* Name */}
      <h2
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
          margin: 0,
        }}
      >
        {profile.username}
      </h2>

      {/* Bio */}
      {profile.bio && (
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            lineHeight: 'var(--line-height-relaxed)',
            margin: 0,
            maxWidth: 280,
          }}
        >
          {profile.bio}
        </p>
      )}

      {/* Church / City */}
      {(profile.church_name || profile.city) && (
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          {[profile.church_name, profile.city].filter(Boolean).join(' · ')}
        </p>
      )}

      <Button variant="ghost" onClick={onEditClick} style={{ marginTop: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        <Pencil size={14} /> Edit Profile
      </Button>
    </div>
  );
}
