import { Skeleton } from '../../../libs/shared-ui/Skeleton';

function BookCardSkeleton() {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Skeleton w="70%" h={15} />
      <Skeleton w="45%" h={11} />
      <Skeleton w="100%" h={11} />
      <Skeleton w="85%" h={11} />
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <Skeleton w={50} h={22} radius="var(--radius-full)" />
        <Skeleton w={60} h={22} radius="var(--radius-full)" />
      </div>
    </div>
  );
}

export default function LibraryLoading() {
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
        <Skeleton w={100} h={18} />
      </div>

      {/* Search bar */}
      <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
        <Skeleton w="100%" h={40} radius="var(--radius-lg)" />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px', flexShrink: 0, overflow: 'hidden' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} w={64} h={28} radius="var(--radius-full)" />
        ))}
      </div>

      {/* Book cards */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
