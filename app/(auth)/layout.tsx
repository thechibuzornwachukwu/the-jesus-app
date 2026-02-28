export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        paddingTop: 'calc(var(--safe-top) + var(--space-6))',
        paddingBottom: 'calc(var(--safe-bottom) + var(--space-6))',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      {children}
    </div>
  );
}
