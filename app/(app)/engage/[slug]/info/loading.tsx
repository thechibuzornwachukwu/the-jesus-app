import { Skeleton } from '../../../../../libs/shared-ui/Skeleton';

export default function CellInfoLoading() {
  return (
    <div
      className="page-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        animationDelay: '150ms',
      }}
    >
      {/* Banner */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Skeleton w="100%" h={160} radius="0" />
        {/* Back button overlay */}
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <Skeleton w={36} h={36} radius="var(--radius-full)" />
        </div>
        {/* Avatar overlapping banner */}
        <div
          style={{
            position: 'absolute',
            bottom: -32,
            left: 16,
          }}
        >
          <Skeleton w={64} h={64} radius="var(--radius-lg)" />
        </div>
      </div>

      {/* Name + category */}
      <div style={{ padding: '44px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton w="55%" h={22} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Skeleton w={70} h={22} radius="var(--radius-full)" />
          <Skeleton w={60} h={14} />
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton w="90%" h={13} />
        <Skeleton w="70%" h={13} />
      </div>

      {/* Join / Enter button */}
      <div style={{ padding: '0 16px 20px' }}>
        <Skeleton w="100%" h={44} radius="var(--radius-full)" />
      </div>

      <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />

      {/* Members section */}
      <div style={{ padding: '16px 16px 8px' }}>
        <Skeleton w={80} h={12} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <Skeleton w={44} h={44} radius="var(--radius-full)" />
              <Skeleton w={36} h={10} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)', margin: '16px 16px 0' }} />

      {/* Rules section */}
      <div style={{ padding: '16px' }}>
        <Skeleton w={60} h={12} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Skeleton w={20} h={20} radius="var(--radius-full)" style={{ flexShrink: 0 }} />
              <Skeleton w="80%" h={13} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
