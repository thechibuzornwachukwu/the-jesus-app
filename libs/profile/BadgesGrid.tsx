'use client';

import React from 'react';
import { Award, BookMarked, Video, Flame, Trophy } from 'lucide-react';
import type { SavedVerse, PostedVideo } from './types';

interface BadgesGridProps {
  savedVerses: SavedVerse[];
  postedVideos: PostedVideo[];
  streak: number;
  longestStreak: number;
}

interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
}

export function BadgesGrid({ savedVerses, postedVideos, streak, longestStreak }: BadgesGridProps) {
  const badges: BadgeDef[] = [
    {
      id: 'first_verse',
      name: 'First Verse',
      description: 'Saved your first verse',
      icon: <BookMarked size={20} color="var(--color-accent)" aria-hidden />,
      earned: savedVerses.length >= 1,
    },
    {
      id: 'verse_collector',
      name: 'Verse Collector',
      description: 'Saved 10 verses',
      icon: <BookMarked size={20} color="var(--color-accent)" aria-hidden />,
      earned: savedVerses.length >= 10,
    },
    {
      id: 'first_video',
      name: 'First Perspective',
      description: 'Shared your first video',
      icon: <Video size={20} color="var(--color-accent)" aria-hidden />,
      earned: postedVideos.length >= 1,
    },
    {
      id: 'streak_7',
      name: '7-Day Streak',
      description: 'Maintained a 7-day streak',
      icon: <Flame size={20} color="var(--color-accent)" aria-hidden />,
      earned: longestStreak >= 7,
    },
    {
      id: 'streak_30',
      name: '30-Day Streak',
      description: 'Maintained a 30-day streak',
      icon: <Flame size={20} color="#f59e0b" aria-hidden />,
      earned: longestStreak >= 30,
    },
    {
      id: 'faithful',
      name: 'Faithful',
      description: 'Current streak of 14+ days',
      icon: <Trophy size={20} color="var(--color-accent)" aria-hidden />,
      earned: streak >= 14,
    },
  ];

  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  if (earned.length === 0 && locked.length === 0) return null;

  return (
    <div style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
      {earned.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'var(--space-8) var(--space-4)',
            gap: 'var(--space-3)',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
          }}
        >
          <Award size={40} strokeWidth={1.2} aria-hidden />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
            No badges yet
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>Keep engaging to earn your first badge</p>
        </div>
      )}

      {earned.length > 0 && (
        <>
          <p style={{ margin: '0 0 var(--space-2)', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
            Earned
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            {earned.map((b) => (
              <BadgeCard key={b.id} badge={b} />
            ))}
          </div>
        </>
      )}

      {locked.length > 0 && (
        <>
          <p style={{ margin: '0 0 var(--space-2)', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
            Locked
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
            {locked.map((b) => (
              <BadgeCard key={b.id} badge={b} locked />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BadgeCard({ badge, locked }: { badge: BadgeDef; locked?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: 'var(--space-3)',
        background: locked ? 'transparent' : 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${locked ? 'var(--color-border)' : 'var(--color-accent)'}`,
        textAlign: 'center',
        opacity: locked ? 0.45 : 1,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--color-accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {badge.icon}
      </div>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>
        {badge.name}
      </p>
    </div>
  );
}
