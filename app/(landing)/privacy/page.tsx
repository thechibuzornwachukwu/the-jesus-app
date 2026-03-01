import Link from 'next/link';

export const metadata = { title: 'Privacy Policy  The JESUS App' };

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100dvh', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '0 0 var(--space-16)' }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textDecoration: 'none', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Home
        </Link>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'var(--space-10) var(--space-5)' }}>
        {/* Title */}
        <h1 style={{ fontFamily: '"Archivo Condensed", sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 6vw, 2.75rem)', letterSpacing: '-0.02em', color: 'var(--color-text)', margin: '0 0 var(--space-2)' }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: '0 0 var(--space-8)' }}>
          Effective date: 01 March 2026
        </p>

        <Section title="1. Overview">
          Your privacy matters to us. This policy explains what data The JESUS App collects, how it is used, and the choices you have. We are committed to handling your personal information with care, transparency, and integrity.
        </Section>

        <Section title="2. Data We Collect">
          We collect the following categories of data: (a) Account data  email address and password (stored securely via Supabase Auth); (b) Profile data  display name, bio, avatar, church, city, and content preferences you choose to provide; (c) Content data  posts, videos, comments, voice notes, saved verses, and course progress you create; (d) Community data  cells you join or create, messages sent within cells, and reactions; (e) Usage data  pages visited, features used, and interaction timestamps, collected to improve the App.
        </Section>

        <Section title="3. How We Use Your Data">
          Your data is used to: provide and personalise the App experience; display your profile and content to other users according to your privacy settings; send you notifications about activity relevant to your account; power AI features such as the Spiritual Guide and sermon notes (queries are processed but not stored long-term beyond conversation history); analyse aggregate usage to improve the App; fulfil legal obligations.
        </Section>

        <Section title="4. Data Sharing">
          We do not sell your personal data. Data may be shared with: Supabase (database and authentication infrastructure); OpenAI (AI feature processing  see their privacy policy); Vercel (hosting and edge functions); web-push providers (for push notifications). All third parties are subject to data processing agreements.
        </Section>

        <Section title="5. Push Notifications">
          If you opt in to push notifications, your browser push subscription endpoint is stored to deliver notifications. You may revoke permission in your device or browser settings at any time.
        </Section>

        <Section title="6. Your Rights">
          Depending on your jurisdiction, you have the right to: access, correct, or delete your personal data; restrict or object to processing; data portability; withdraw consent. To exercise these rights, use the Account Settings within the App or contact us directly.
        </Section>

        <Section title="7. Account Deletion">
          You may delete your account from Profile &gt; Settings. Deletion soft-deletes your profile and removes personal identifiers within 30 days. Some content (e.g., anonymised community posts) may persist in aggregate.
        </Section>

        <Section title="8. Cookies & Storage">
          The App uses browser local storage and cookies solely for authentication session management (via Supabase). No third-party advertising or tracking cookies are used.
        </Section>

        <Section title="9. Children's Privacy">
          The App is not directed to children under 13. We do not knowingly collect data from children under 13. If you believe a minor's data has been collected, please contact us immediately.
        </Section>

        <Section title="10. Security">
          We implement industry-standard security measures including encrypted connections (HTTPS), hashed passwords, row-level security policies in the database, and scoped API keys. No method of transmission is 100% secure; we cannot guarantee absolute security.
        </Section>

        <Section title="11. Changes to This Policy">
          We may update this policy from time to time. We will notify you of significant changes through the App. Continued use after changes constitutes acceptance.
        </Section>

        <Section title="12. Contact">
          Privacy questions or requests can be directed to us via the App's support channel.
        </Section>

        <LegalFooter />
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-7)' }}>
      <h2 style={{ fontFamily: '"Archivo Condensed", sans-serif', fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--color-text)', margin: '0 0 var(--space-2)' }}>
        {title}
      </h2>
      <p style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 'var(--font-size-base)', lineHeight: 1.75, color: 'var(--color-text-muted)', margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

function LegalFooter() {
  return (
    <div style={{ marginTop: 'var(--space-12)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
      {[{ href: '/terms', label: 'Terms' }, { href: '/privacy', label: 'Privacy' }, { href: '/purity', label: 'Purity Pledge' }].map(({ href, label }) => (
        <Link key={href} href={href} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', textDecoration: 'none', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 500 }}>
          {label}
        </Link>
      ))}
    </div>
  );
}
