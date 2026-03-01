'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Users, Flame, BookOpen } from 'lucide-react';
import { Avatar } from '../shared-ui/Avatar';
import type { FullProfile } from './types';

// ── 2A: deterministic hue helpers ────────────────────────────────────────────
function usernameToHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return h % 360;
}
function getBannerGradient(hue: number): string {
  return `linear-gradient(135deg, hsl(${hue},35%,12%) 0%, hsl(${(hue + 20) % 360},45%,18%) 50%, hsl(${(hue + 40) % 360},30%,10%) 100%)`;
}

// ── 2C: sub-components ───────────────────────────────────────────────────────
interface StatPillProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  highlight?: boolean;
}
function StatPill({ icon, value, label, highlight }: StatPillProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon}
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-bold)',
            color: highlight ? 'var(--color-accent)' : 'var(--color-text)',
          }}
        >
          {value}
        </span>
      </div>
      <span
        style={{
          fontSize: '0.62rem',
          color: 'var(--color-text-faint)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PipeSep() {
  return (
    <div
      style={{
        width: 1,
        height: 32,
        background: 'var(--color-accent)',
        opacity: 0.25,
        flexShrink: 0,
      }}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface ProfileHeaderProps {
  profile: FullProfile;
  friendCount: number;
  streakCount: number;
}

export function ProfileHeader({ profile, friendCount, streakCount }: ProfileHeaderProps) {
  const router = useRouter();
  const hue = usernameToHue(profile.username ?? '');
  const bannerGradient = getBannerGradient(hue);

  return (
    <div>
      {/* 2B: Banner */}
      <div style={{ height: 100, width: '100%', background: bannerGradient }} />

      {/* Avatar overlap zone */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: -44,
          padding: '0 var(--space-4)',
        }}
      >
        {/* Avatar + edit badge */}
        <button
          onClick={() => router.push('/profile/edit')}
          aria-label="Edit profile"
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {/* gold ring + bg gap */}
          <div
            style={{
              borderRadius: 'var(--radius-full)',
              padding: 3,
              background: 'var(--color-accent)',
              boxShadow: '0 0 0 3px var(--color-bg)',
              lineHeight: 0,
            }}
          >
            <Avatar src={profile.avatar_url} name={profile.username} size={88} />
          </div>

          {/* pencil badge */}
          <span
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 24,
              height: 24,
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

        {/* Identity block */}
        <div style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text)',
              lineHeight: 1.1,
            }}
          >
            @{profile.username}
          </p>

          {(profile.church_name || profile.city) && (
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-faint)',
              }}
            >
              {[profile.church_name, profile.city].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            marginTop: 'var(--space-4)',
          }}
        >
          <StatPill
            icon={<Users size={13} style={{ color: 'var(--color-text-muted)' }} />}
            value={friendCount}
            label="Friends"
          />
          <PipeSep />
          <StatPill
            icon={
              <Flame
                size={13}
                style={{ color: streakCount > 0 ? 'var(--color-accent)' : 'var(--color-text-faint)' }}
              />
            }
            value={streakCount}
            label="Streak"
            highlight={streakCount > 0}
          />
          <PipeSep />
          <StatPill
            icon={<BookOpen size={13} style={{ color: 'var(--color-text-muted)' }} />}
            value={0}
            label="Courses"
          />
        </div>

        {/* Bio */}
        {profile.bio && (
          <p
            style={{
              margin: 'var(--space-3) 0 0',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              lineHeight: 'var(--line-height-relaxed)',
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {profile.bio}
          </p>
        )}
      </div>

      {/* bottom spacing */}
      <div style={{ height: 'var(--space-4)' }} />
    </div>
  );
}
