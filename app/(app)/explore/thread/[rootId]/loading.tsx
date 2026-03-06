import { Skeleton } from '../../../../../libs/shared-ui/Skeleton';

function CommentRowSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0' }}>
      <Skeleton w={36} h={36} radius="var(--radius-full)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Skeleton w={80} h={12} />
          <Skeleton w={40} h={10} />
        </div>
        <Skeleton w="85%" h={13} />
        <Skeleton w="55%" h={13} />
      </div>
    </div>
  );
}

export default function ThreadLoading() {
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
        <Skeleton w={80} h={16} />
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '0 16px' }}>
        {/* Root post */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <Skeleton w={44} h={44} radius="var(--radius-full)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton w={110} h={14} />
              <Skeleton w={70} h={11} />
            </div>
          </div>
          {/* Post text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
            <Skeleton w="100%" h={15} />
            <Skeleton w="90%" h={15} />
            <Skeleton w="65%" h={15} />
          </div>
          {/* Post image */}
          <Skeleton w="100%" h={200} radius="var(--radius-lg)" style={{ marginBottom: 12 }} />
          {/* Action row */}
          <div style={{ display: 'flex', gap: 20 }}>
            <Skeleton w={48} h={28} radius="var(--radius-full)" />
            <Skeleton w={48} h={28} radius="var(--radius-full)" />
            <Skeleton w={48} h={28} radius="var(--radius-full)" />
          </div>
        </div>

        {/* Comment list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <CommentRowSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
