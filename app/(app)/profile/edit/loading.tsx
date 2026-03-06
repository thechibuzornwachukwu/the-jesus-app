import { Skeleton } from '../../../../libs/shared-ui/Skeleton';

export default function EditProfileLoading() {
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
      {/* Header */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <Skeleton w={28} h={28} radius="var(--radius-full)" />
        <Skeleton w={90} h={16} />
        <Skeleton w={52} h={30} radius="var(--radius-full)" />
      </div>

      {/* Avatar upload */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 16px 20px',
          gap: 10,
        }}
      >
        <Skeleton w={80} h={80} radius="var(--radius-full)" />
        <Skeleton w={110} h={13} />
      </div>

      {/* Form fields */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton w={50} h={11} />
          <Skeleton w="100%" h={44} radius="var(--radius-lg)" />
        </div>

        {/* Username */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton w={72} h={11} />
          <Skeleton w="100%" h={44} radius="var(--radius-lg)" />
        </div>

        {/* Bio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton w={30} h={11} />
          <Skeleton w="100%" h={88} radius="var(--radius-lg)" />
        </div>

        {/* Church */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton w={50} h={11} />
          <Skeleton w="100%" h={44} radius="var(--radius-lg)" />
        </div>

        {/* City */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton w={30} h={11} />
          <Skeleton w="100%" h={44} radius="var(--radius-lg)" />
        </div>

        {/* Public toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Skeleton w={100} h={14} />
            <Skeleton w={160} h={11} />
          </div>
          <Skeleton w={44} h={26} radius="var(--radius-full)" />
        </div>
      </div>
    </div>
  );
}
