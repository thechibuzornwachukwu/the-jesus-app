'use client';

import Link from 'next/link';

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'Engage',
    title: 'Faith Communities',
    desc: 'Join or create faith cells — small groups for worship, prayer, and real accountability.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    label: 'Explore',
    title: 'Perspective Feed',
    desc: 'Short-form video perspectives on scripture, testimonies, and Christian living — scroll with purpose.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    label: 'Learn',
    title: 'AI Discipleship',
    desc: 'Faith courses, sermon notes, and an AI spiritual guide rooted in scripture — grow at your own pace.',
  },
];

export default function LandingPage() {
  return (
    <main style={{
      minHeight: '100dvh',
      background: 'var(--color-bg)',
      color: 'var(--color-text)',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden',
    }}>

      {/* ── Nav ──────────────────────────────────── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'var(--color-bg)',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: '1.25rem',
          letterSpacing: '0.04em',
          color: 'var(--color-accent)',
        }}>
          THE JESUS APP
        </span>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/sign-in" style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            padding: '0.5rem 0.875rem',
          }}>
            Sign In
          </Link>
          <Link href="/sign-up" style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-accent-text)',
            background: 'var(--color-accent)',
            borderRadius: 'var(--radius-full)',
            padding: '0.5rem 1.25rem',
            textDecoration: 'none',
          }}>
            Join Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────── */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '5rem 1.5rem 4rem',
        position: 'relative',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at center top, rgba(212,146,42,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          marginBottom: '1.25rem',
          padding: '0.35rem 0.875rem',
          border: '1px solid rgba(212,146,42,0.35)',
          borderRadius: 'var(--radius-full)',
        }}>
          Faith · Community · Growth
        </span>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 'clamp(2.75rem, 10vw, 5rem)',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: 'var(--color-text)',
          marginBottom: '1.5rem',
          maxWidth: '700px',
        }}>
          KNOW HIM.<br />GROW TOGETHER.
        </h1>

        <p style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          lineHeight: 1.7,
          color: 'var(--color-text-muted)',
          maxWidth: '480px',
          marginBottom: '2.5rem',
        }}>
          "As iron sharpens iron, so one person sharpens another."
          <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.8em', letterSpacing: '0.04em', fontStyle: 'normal', fontFamily: 'var(--font-sans)', color: 'var(--color-text-faint)' }}>Proverbs 27:17</span>
        </p>

        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/sign-up" style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--color-accent-text)',
            background: 'var(--color-accent)',
            borderRadius: 'var(--radius-full)',
            padding: '0.875rem 2rem',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}>
            Start Your Journey
          </Link>
          <Link href="/sign-in" style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            padding: '0.875rem 2rem',
            textDecoration: 'none',
          }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────── */}
      <div style={{ height: '1px', background: 'var(--color-border)', margin: '0 1.5rem' }} />

      {/* ── Features ─────────────────────────────── */}
      <section style={{
        padding: '4rem 1.5rem',
        maxWidth: '960px',
        margin: '0 auto',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 'clamp(1.75rem, 6vw, 2.75rem)',
          letterSpacing: '-0.01em',
          textAlign: 'center',
          marginBottom: '0.75rem',
          color: 'var(--color-text)',
        }}>
          EVERYTHING YOUR FAITH NEEDS
        </h2>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '1rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          marginBottom: '3rem',
          maxWidth: '400px',
          margin: '0 auto 3rem',
        }}>
          One app. Community, content, and courses built for Christian growth.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}>
          {features.map((f) => (
            <div key={f.label} style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.75rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {f.icon}
              </div>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
              }}>
                {f.label}
              </span>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.35rem',
                letterSpacing: '-0.01em',
                color: 'var(--color-text)',
                margin: 0,
              }}>
                {f.title}
              </h3>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                lineHeight: 1.65,
                color: 'var(--color-text-muted)',
                margin: 0,
              }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Scripture Banner ─────────────────────── */}
      <section style={{
        margin: '0 1.5rem 4rem',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--gradient-verse-banner)',
        border: '1px solid rgba(212,146,42,0.25)',
        padding: '3rem 2rem',
        textAlign: 'center',
        maxWidth: '960px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        {/* Cross */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginBottom: '1.25rem', opacity: 0.7 }}>
          <rect x="13" y="2" width="6" height="28" rx="2" fill="var(--color-accent)"/>
          <rect x="2" y="10" width="28" height="6" rx="2" fill="var(--color-accent)"/>
        </svg>
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)',
          lineHeight: 1.7,
          color: 'var(--color-text)',
          maxWidth: '560px',
          margin: '0 auto 1rem',
        }}>
          "I can do all things through Christ who strengthens me."
        </p>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
        }}>
          Philippians 4:13
        </span>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section style={{
        textAlign: 'center',
        padding: '2rem 1.5rem 5rem',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
          letterSpacing: '-0.01em',
          color: 'var(--color-text)',
          marginBottom: '1rem',
        }}>
          READY TO GROW?
        </h2>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '1rem',
          color: 'var(--color-text-muted)',
          marginBottom: '2rem',
        }}>
          Join thousands of believers on the journey.
        </p>
        <Link href="/sign-up" style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--color-accent-text)',
          background: 'var(--color-accent)',
          borderRadius: 'var(--radius-full)',
          padding: '1rem 2.5rem',
          textDecoration: 'none',
          display: 'inline-block',
          letterSpacing: '0.01em',
        }}>
          Create Free Account
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '0.9rem',
          letterSpacing: '0.06em',
          color: 'var(--color-accent)',
        }}>
          THE JESUS APP
        </span>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          {[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
          ].map((l) => (
            <Link key={l.label} href={l.href} style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              color: 'var(--color-text-faint)',
              textDecoration: 'none',
            }}>
              {l.label}
            </Link>
          ))}
        </div>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.75rem',
          color: 'var(--color-text-faint)',
        }}>
          © {new Date().getFullYear()} The JESUS App
        </span>
      </footer>

    </main>
  );
}
