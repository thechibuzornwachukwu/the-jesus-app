import { Skeleton } from '../../../libs/shared-ui/Skeleton';

export default function LearnLoading() {
  return (
    <div className="page-enter" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <Skeleton w={80} h={24} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Skeleton w={100} h={36} radius="var(--radius-full)" />
        <Skeleton w={120} h={36} radius="var(--radius-full)" />
      </div>

      {/* Course grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton h={120} radius="var(--radius-lg)" />
            <Skeleton w="70%" h={14} />
            <Skeleton w="50%" h={11} />
          </div>
        ))}
      </div>
    </div>
  );
}
