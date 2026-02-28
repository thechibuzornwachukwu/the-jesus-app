'use client';

import React, { useState } from 'react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { Input } from '../shared-ui/Input';
import { Button } from '../shared-ui/Button';
import { updateProfile } from '../../lib/profile/actions';
import type { FullProfile } from './types';

interface EditProfileSheetProps {
  profile: FullProfile;
  open: boolean;
  onClose: () => void;
  onSaved: (p: FullProfile) => void;
}

export function EditProfileSheet({ profile, open, onClose, onSaved }: EditProfileSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const result = await updateProfile(form);

    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else if (result.profile) {
      onSaved(result.profile);
      onClose();
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input
          name="username"
          label="Username"
          defaultValue={profile.username}
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
            defaultValue={profile.bio ?? ''}
            placeholder="A short faith bio…"
            maxLength={200}
            rows={3}
            style={{
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-base)',
              resize: 'vertical',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--line-height-normal)',
              outline: 'none',
            }}
          />
        </div>
        <Input
          name="church_name"
          label="Church"
          defaultValue={profile.church_name ?? ''}
          placeholder="Your church name"
        />
        <Input
          name="city"
          label="City"
          defaultValue={profile.city ?? ''}
          placeholder="Your city"
        />

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
          <Button type="button" variant="ghost" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} style={{ flex: 1 }}>
            Save
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
