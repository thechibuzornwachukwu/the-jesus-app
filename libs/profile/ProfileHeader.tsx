'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Users, Flame } from 'lucide-react';
import { Avatar } from '../shared-ui/Avatar';
import type { FullProfile } from './types';

interface ProfileHeaderProps {
  profile: FullProfile;
  friendCount: number;
  streakCount: number;
}

export function ProfileHeader({ profile, friendCount, streakCount }: ProfileHeaderProps) {
  const router = useRouter();

  return (
    <div style={{ padding: 'var(--space-4) var(--space-4) var(--space-3)' }}>
      {/* Top row: avatar (left) + info (right) */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        {/* Avatar + pencil  tapping navigates to edit page */}
        <button
          onClick={() => router.push('/profile/edit')}
          aria-label="Edit profile"
          style={{
            position: 'relative',
            flexShrink: 0,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              borderRadius: 'var(--radius-full)',
              outline: '2px solid var(--color-accent)',
              outlineOffset: 2,
              lineHeight: 0,
            }}
          >
            <Avatar src={profile.avatar_url} name={profile.username} size={72} />
          </div>
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 22,
              height: 22,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-accent)',
              border: '2px solid var(--color-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent-text)',
            }}
          >
            <Pencil size={11} />
          </span>
        </button>

        {/* Right column: @username + stats */}
        <div style={{ flex: 1, paddingTop: 'var(--space-1)' }}>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            @{profile.username}
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-5)', marginTop: 'var(--space-3)' }}>
            {/* Friends */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={13} style={{ color: 'var(--color-text-muted)' }} />
                <span
                  style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {friendCount}
                </span>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Friends
              </span>
            </div>

            {/* Streaks */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Flame size={13} style={{ color: streakCount > 0 ? 'var(--color-accent)' : 'var(--color-text-faint)' }} />
                <span
                  style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: streakCount > 0 ? 'var(--color-text)' : 'var(--color-text-faint)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {streakCount}
                </span>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Streaks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p
          style={{
            margin: 'var(--space-1) 0 0',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          {profile.bio}
        </p>
      )}
    </div>
  );
}
