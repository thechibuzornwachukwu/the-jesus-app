import { Skeleton } from '../../../libs/shared-ui/Skeleton';

export default function ProfileLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 8px' }}>
        <Skeleton w={100} h={20} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton w={36} h={36} radius="var(--radius-full)" />
          <Skeleton w={36} h={36} radius="var(--radius-full)" />
        </div>
      </div>

      {/* Profile header */}
      <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Skeleton w={80} h={80} radius="var(--radius-full)" />
        <Skeleton w={120} h={18} />
        <Skeleton w={160} h={13} />
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Skeleton w={32} h={18} />
              <Skeleton w={48} h={11} />
            </div>
          ))}
        </div>
        <Skeleton w={120} h={36} radius="var(--radius-full)" />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 16px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} w={64} h={36} radius="var(--radius-sm)" style={{ margin: '0 8px' }} />
        ))}
      </div>

      {/* Content grid */}
      <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} h={100} radius="var(--radius-sm)" />
        ))}
      </div>
    </div>
  );
}
