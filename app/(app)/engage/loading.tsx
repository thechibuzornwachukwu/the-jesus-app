import { Skeleton } from '../../../libs/shared-ui/Skeleton';

function CellRowSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px' }}>
      <Skeleton w={48} h={48} radius="12px" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton w="60%" h={14} />
        <Skeleton w="40%" h={11} />
      </div>
    </div>
  );
}

export default function EngageLoading() {
  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header bar skeleton */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <Skeleton w={80} h={22} radius="var(--radius-sm)" />
        <div style={{ flex: 1 }} />
        <Skeleton w={36} h={36} radius="var(--radius-full)" />
        <Skeleton w={36} h={36} radius="var(--radius-full)" />
      </div>

      <div style={{ flex: 1, padding: '12px 16px 24px', overflow: 'hidden' }}>
        {/* My Cells */}
        <Skeleton w={80} h={12} style={{ marginBottom: 12 }} />
        {Array.from({ length: 3 }).map((_, i) => <CellRowSkeleton key={i} />)}

        <div style={{ height: 1, background: 'var(--color-border)', margin: '16px 0' }} />

        {/* Discover */}
        <Skeleton w={64} h={12} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} w={70} h={28} radius="var(--radius-full)" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => <CellRowSkeleton key={i} />)}
      </div>
    </div>
  );
}
