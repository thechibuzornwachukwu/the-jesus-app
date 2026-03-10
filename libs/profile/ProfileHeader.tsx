'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Flame, BookOpen, Lock, UserCheck, UserPlus } from 'lucide-react';
import { Avatar } from '../shared-ui/Avatar';
import { vibrate } from '../shared-ui/haptics';
import type { FullProfile } from './types';

// ── deterministic hue helpers ─────────────────────────────────────────────────
function usernameToHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return h % 360;
}
function getBannerGradient(hue: number): string {
  return `linear-gradient(135deg, hsl(${hue},35%,12%) 0%, hsl(${(hue + 20) % 360},45%,18%) 50%, hsl(${(hue + 40) % 360},30%,10%) 100%)`;
}

// ── StatPill ──────────────────────────────────────────────────────────────────
interface StatPillProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  highlight?: boolean;
  onClick?: () => void;
}
function StatPill({ icon, value, label, highlight, onClick }: StatPillProps) {
  const isClickable = !!onClick;
  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        background: 'none',
        border: 'none',
        padding: '4px 6px',
        borderRadius: 'var(--radius-md)',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'background 0.12s',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        if (isClickable) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-soft)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'none';
      }}
    >
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
          color: isClickable ? 'var(--color-text-muted)' : 'var(--color-text-faint)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}
      >
        {label}
      </span>
    </button>
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
  streakCount: number;
  followerCount: number;
  followingCount: number;
  /** true = viewing own profile (default). false = public view of another user */
  isOwnProfile?: boolean;
  /** public view — is the viewer already following this user? */
  isFollowing?: boolean;
  isFollowPending?: boolean;
  onFollowToggle?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export function ProfileHeader({
  profile,
  streakCount,
  followerCount,
  followingCount,
  isOwnProfile = true,
  isFollowing = false,
  isFollowPending = false,
  onFollowToggle,
  onFollowersClick,
  onFollowingClick,
}: ProfileHeaderProps) {
  const router = useRouter();
  const hue = usernameToHue(profile.username ?? '');
  const bannerGradient = getBannerGradient(hue);

  const isPrivateAndNotFollowing = !isOwnProfile && !profile.is_public && !isFollowing;

  return (
    <div>
      {/* Banner */}
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
        {/* Avatar */}
        {isOwnProfile ? (
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
        ) : (
          <div
            style={{
              borderRadius: 'var(--radius-full)',
              padding: 3,
              background: 'var(--color-accent)',
              boxShadow: '0 0 0 3px var(--color-bg)',
              lineHeight: 0,
              flexShrink: 0,
            }}
          >
            <Avatar src={profile.avatar_url} name={profile.username} size={88} />
          </div>
        )}

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

        {/* Follow / Following button — other user's profile only */}
        {!isOwnProfile && onFollowToggle && (
          <button
            onClick={() => { vibrate([8]); onFollowToggle(); }}
            disabled={isFollowPending}
            style={{
              marginTop: 'var(--space-3)',
              padding: '8px 28px',
              borderRadius: 'var(--radius-full)',
              border: isFollowing ? '1px solid var(--color-border)' : 'none',
              background: isFollowing ? 'transparent' : 'var(--color-accent)',
              color: isFollowing ? 'var(--color-text-muted)' : 'var(--color-accent-text)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: isFollowPending ? 'default' : 'pointer',
              opacity: isFollowPending ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s, opacity 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isFollowing
              ? <><UserCheck size={14} /> Following</>
              : <><UserPlus size={14} /> Follow</>}
          </button>
        )}

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-4)',
          }}
        >
          <StatPill
            icon={<span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>👥</span>}
            value={followerCount}
            label="Followers"
            onClick={onFollowersClick ? () => { vibrate([6]); onFollowersClick!(); } : undefined}
          />
          <PipeSep />
          <StatPill
            icon={<span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>➕</span>}
            value={followingCount}
            label="Following"
            onClick={onFollowingClick ? () => { vibrate([6]); onFollowingClick!(); } : undefined}
          />
          <PipeSep />
          {isOwnProfile ? (
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
          ) : (
            <StatPill
              icon={<BookOpen size={13} style={{ color: 'var(--color-text-muted)' }} />}
              value={0}
              label="Courses"
            />
          )}
        </div>

        {/* Bio */}
        {profile.bio && !isPrivateAndNotFollowing && (
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

        {/* Private account notice */}
        {isPrivateAndNotFollowing && (
          <div
            style={{
              marginTop: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: 'var(--color-text-faint)',
            }}
          >
            <Lock size={28} style={{ opacity: 0.5 }} />
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-muted)',
              }}
            >
              Private Account
            </p>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-faint)', textAlign: 'center' }}>
              Follow to see their posts and verses.
            </p>
          </div>
        )}
      </div>

      {/* bottom spacing */}
      <div style={{ height: 'var(--space-4)' }} />
    </div>
  );
}
