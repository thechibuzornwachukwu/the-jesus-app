import { Skeleton } from '../../../../../libs/shared-ui/Skeleton';

export default function JoinByInviteLoading() {
  return (
    <div
      className="page-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        padding: '0 24px',
        animationDelay: '150ms',
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Cell avatar */}
        <Skeleton w={72} h={72} radius="var(--radius-lg)" />

        {/* Cell name */}
        <Skeleton w={140} h={20} />

        {/* Category badge */}
        <Skeleton w={80} h={24} radius="var(--radius-full)" />

        {/* Description */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <Skeleton w="85%" h={13} />
          <Skeleton w="65%" h={13} />
        </div>

        {/* Member count */}
        <Skeleton w={90} h={13} />

        <div style={{ height: 8 }} />

        {/* Join button */}
        <Skeleton w="100%" h={44} radius="var(--radius-full)" />

        {/* Cancel link */}
        <Skeleton w={80} h={13} />
      </div>
    </div>
  );
}
