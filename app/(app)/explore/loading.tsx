import { Skeleton } from '../../../libs/shared-ui/Skeleton';

export default function ExploreLoading() {
  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      {/* Daily verse banner skeleton */}
      <div style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Skeleton w={24} h={24} radius="var(--radius-full)" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton w="70%" h={12} />
          <Skeleton w="40%" h={10} />
        </div>
      </div>

      {/* Video card skeleton  fills rest of viewport */}
      <div style={{ flex: 1, background: 'var(--color-surface)', position: 'relative' }}>
        <Skeleton w="100%" h="100%" radius="0" style={{ position: 'absolute', inset: 0 }} />
        {/* Author chip */}
        <div style={{ position: 'absolute', top: 16, left: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Skeleton w={36} h={36} radius="var(--radius-full)" />
          <Skeleton w={80} h={12} />
        </div>
        {/* Action buttons */}
        <div style={{ position: 'absolute', right: 12, bottom: 80, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} w={48} h={48} radius="var(--radius-full)" />
          ))}
        </div>
        {/* Caption */}
        <div style={{ position: 'absolute', bottom: 16, left: 12, right: 80, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton w="80%" h={13} />
          <Skeleton w="50%" h={13} />
        </div>
      </div>
    </div>
  );
}
