import { Skeleton } from '../../../libs/shared-ui/Skeleton';

export default function BibleLoading() {
  return (
    <div
      className="page-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        animationDelay: '150ms',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <Skeleton w={28} h={28} radius="var(--radius-full)" />
        <Skeleton w={120} h={18} />
        <div style={{ flex: 1 }} />
        <Skeleton w={32} h={32} radius="var(--radius-full)" />
        <Skeleton w={32} h={32} radius="var(--radius-full)" />
      </div>

      {/* Search bar */}
      <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
        <Skeleton w="100%" h={40} radius="var(--radius-full)" />
      </div>

      {/* Quick reference chips */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', flexShrink: 0, overflow: 'hidden' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} w={70} h={28} radius="var(--radius-full)" />
        ))}
      </div>

      {/* Verse-of-day banner */}
      <div
        style={{
          margin: '0 16px 16px',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          background: 'var(--color-surface)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <Skeleton w={80} h={11} />
        <Skeleton w="90%" h={14} />
        <Skeleton w="70%" h={14} />
        <Skeleton w={100} h={11} />
      </div>

      {/* Passage verses */}
      <div style={{ flex: 1, overflowY: 'hidden', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <Skeleton w={60} h={11} />
            <Skeleton w="95%" h={14} />
            <Skeleton w="80%" h={14} />
          </div>
        ))}
      </div>
    </div>
  );
}
