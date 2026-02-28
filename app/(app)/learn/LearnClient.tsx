'use client';

import React, { useState } from 'react';
import { FaithCourses } from '../../../libs/learn/FaithCourses';
import { SermonExtractor } from '../../../libs/learn/SermonExtractor';
import { SpiritualGuide } from '../../../libs/learn/SpiritualGuide';
import type { CourseProgress } from '../../../libs/learn/types';
import { TabBar } from '../../../libs/shared-ui';

type Tab = 'courses' | 'sermon';

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: 'courses', label: 'Faith Courses' },
  { id: 'sermon', label: 'Sermon Notes' },
];

interface LearnClientProps {
  initialProgress: CourseProgress[];
}

export function LearnClient({ initialProgress }: LearnClientProps) {
  const [tab, setTab] = useState<Tab>('courses');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Page header */}
      <div
        style={{
          padding: 'var(--space-6) var(--space-6) 0',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontFamily: "'Archivo Condensed', var(--font-display)",
            margin: '0 0 var(--space-1)',
            fontSize: 'var(--font-size-4xl)',
            fontWeight: 'var(--font-weight-black)' as React.CSSProperties['fontWeight'],
            letterSpacing: 'var(--letter-spacing-tight)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          Equip
        </h1>
        <p
          style={{
            margin: '0 0 var(--space-5)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          AI-powered discipleship &amp; courses
        </p>

        <TabBar
          tabs={TAB_LABELS}
          activeId={tab}
          onChange={(id) => setTab(id as Tab)}
          variant="pill"
        />
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-5) var(--space-6)',
          paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 72px)', // room for FAB
        }}
      >
        {tab === 'courses' ? (
          <FaithCourses initialProgress={initialProgress} />
        ) : (
          <SermonExtractor />
        )}
      </div>

      {/* Floating AI Guide (cross FAB) */}
      <SpiritualGuide />
    </div>
  );
}
