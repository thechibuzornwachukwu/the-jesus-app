import Link from 'next/link';

export const metadata = { title: 'Purity Pledge — The JESUS App' };

export default function PurityPage() {
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
          Purity Pledge
        </h1>
        <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: '0 0 var(--space-4)' }}>
          Effective date: 01 March 2026
        </p>

        {/* Scripture */}
        <blockquote style={{ margin: '0 0 var(--space-10)', padding: 'var(--space-5) var(--space-6)', borderLeft: '3px solid var(--color-accent)', background: 'var(--color-accent-soft)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
          <p style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: 'var(--font-size-lg)', lineHeight: 1.7, color: 'var(--color-text)', margin: '0 0 var(--space-2)' }}>
            "Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable — if anything is excellent or praiseworthy — think about such things."
          </p>
          <cite style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', fontStyle: 'normal', fontWeight: 600 }}>
            Philippians 4:8 (NIV)
          </cite>
        </blockquote>

        <Section title="Our Commitment">
          The JESUS App is a sacred space built on the foundation of Christ. We believe that the digital environments we inhabit shape our hearts and minds. This Purity Pledge defines the standard we hold ourselves and our community to — not out of legalism, but out of love for God and one another.
        </Section>

        <Section title="What We Do Not Allow">
          The following content is strictly prohibited on The JESUS App: sexually explicit or suggestive material of any kind; pornography or links to pornographic content; nudity or partial nudity presented in a sexual context; language that is crude, vulgar, or sexually charged; content that sexualises minors in any way; predatory, manipulative, or inappropriate romantic messaging; content that glamorises sin or contradicts biblical values without redemptive purpose.
        </Section>

        <Section title="What We Encourage">
          We actively cultivate content and conversations that: edify the body of Christ (1 Corinthians 14:26); speak truth in love (Ephesians 4:15); protect the innocence of younger believers (Matthew 18:6); honour God with our bodies and minds (1 Corinthians 6:19–20); pursue reconciliation, grace, and accountability over condemnation.
        </Section>

        <Section title="Community Accountability">
          Every user is both a member and a guardian of this community. If you encounter content that violates this pledge, please report it immediately using the flag function in the App. Reports are reviewed by our moderation team. We take every report seriously and act swiftly to protect the community.
        </Section>

        <Section title="Enforcement">
          Violations of this pledge may result in: content removal, a warning, temporary suspension, or permanent account removal — depending on the severity and pattern of the violation. Serious violations (e.g., content involving minors) will be reported to the appropriate authorities without exception.
        </Section>

        <Section title="Grace and Restoration">
          We believe in redemption. If you have struggled with purity and have posted content that violates this pledge, you may contact our team. We will handle your situation with confidentiality, compassion, and a commitment to your restoration — while still upholding community safety.
        </Section>

        <Section title="Personal Pledge">
          By using The JESUS App, you affirm that you will: post only content you would be comfortable with Jesus seeing; honour your brothers and sisters in Christ with your words and media; report violations you encounter; submit to the authority of this pledge as part of community membership.
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
