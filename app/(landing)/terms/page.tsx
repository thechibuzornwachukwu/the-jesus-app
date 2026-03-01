import Link from 'next/link';

export const metadata = { title: 'Terms of Service  The JESUS App' };

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: '0 0 var(--space-8)' }}>
          Effective date: 01 March 2026
        </p>

        <Section title="1. Acceptance of Terms">
          By accessing or using The JESUS App ("the App"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use the App.
        </Section>

        <Section title="2. Use of the App">
          The App is a Christian community platform for worship, fellowship, discipleship, and spiritual growth. You must be at least 13 years old to use the App. You agree to use the App only for lawful purposes and in a manner consistent with its mission to glorify Jesus Christ and build up His body.
        </Section>

        <Section title="3. Account Responsibilities">
          You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate information and to update it as necessary. You may not transfer your account to another person.
        </Section>

        <Section title="4. Community Standards">
          All users must adhere to our Community Standards, which prohibit harassment, hate speech, sexual content, false doctrine, spam, and any content that dishonours Christ or harms others. Violations may result in content removal or account suspension without notice.
        </Section>

        <Section title="5. Content Ownership">
          You retain ownership of the content you post. By posting, you grant The JESUS App a worldwide, non-exclusive, royalty-free licence to use, display, and distribute your content within the App for the purpose of providing the service. You represent that you have the right to post such content.
        </Section>

        <Section title="6. Intellectual Property">
          The App's design, code, branding, and curated content are the property of The JESUS App and are protected by applicable intellectual property laws. Scripture quotations are used under fair use for educational and devotional purposes.
        </Section>

        <Section title="7. Disclaimer of Warranties">
          The App is provided "as is" without warranties of any kind, express or implied. We do not warrant that the App will be uninterrupted, error-free, or free from harmful components. Spiritual content is provided for edification and does not constitute professional counselling or theological authority.
        </Section>

        <Section title="8. Limitation of Liability">
          To the fullest extent permitted by law, The JESUS App and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App, including loss of data or spiritual community access.
        </Section>

        <Section title="9. Modifications">
          We reserve the right to modify these terms at any time. Continued use of the App after changes constitutes acceptance of the revised terms. Material changes will be communicated via the App.
        </Section>

        <Section title="10. Governing Law">
          These terms are governed by the laws of the jurisdiction in which the App operates, without regard to conflict of law provisions.
        </Section>

        <Section title="11. Contact">
          For questions regarding these terms, contact us through the App's support channel or at the email provided on the App's landing page.
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
