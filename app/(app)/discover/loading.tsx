import React from 'react';
import { Skeleton } from '../../../libs/shared-ui/Skeleton';

export default function DiscoverLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <Skeleton style={{ height: 26, width: 110, borderRadius: 'var(--radius-md)' }} />
      </div>

      {/* Search bar */}
      <div style={{ padding: 'var(--space-3) var(--space-4)', flexShrink: 0 }}>
        <Skeleton style={{ height: 40, borderRadius: 'var(--radius-full)' }} />
      </div>

      {/* Sections */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            paddingBottom: 'var(--space-6)',
          }}
        >
          {/* Trending verses */}
          <section>
            <Skeleton
              style={{ height: 14, width: 120, marginLeft: 'var(--space-4)', marginBottom: 10, borderRadius: 'var(--radius-sm)' }}
            />
            <div style={{ display: 'flex', gap: 8, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)' }}>
              {[100, 112, 96, 120, 92, 108].map((w, i) => (
                <Skeleton
                  key={i}
                  style={{ height: 34, width: w, borderRadius: 'var(--radius-full)', flexShrink: 0 }}
                />
              ))}
            </div>
          </section>

          {/* People */}
          <section>
            <Skeleton
              style={{ height: 14, width: 80, marginLeft: 'var(--space-4)', marginBottom: 10, borderRadius: 'var(--radius-sm)' }}
            />
            <div style={{ display: 'flex', gap: 8, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  style={{ height: 160, width: 120, borderRadius: 'var(--radius-lg)', flexShrink: 0 }}
                />
              ))}
            </div>
          </section>

          {/* Courses */}
          <section>
            <Skeleton
              style={{ height: 14, width: 90, marginLeft: 'var(--space-4)', marginBottom: 10, borderRadius: 'var(--radius-sm)' }}
            />
            <div style={{ display: 'flex', gap: 8, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)' }}>
              {[0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  style={{ height: 100, width: 160, borderRadius: 'var(--radius-lg)', flexShrink: 0 }}
                />
              ))}
            </div>
          </section>

          {/* Books */}
          <section>
            <Skeleton
              style={{ height: 14, width: 70, marginLeft: 'var(--space-4)', marginBottom: 10, borderRadius: 'var(--radius-sm)' }}
            />
            <div style={{ display: 'flex', gap: 8, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)' }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  style={{ height: 200, width: 120, borderRadius: 'var(--radius-lg)', flexShrink: 0 }}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
