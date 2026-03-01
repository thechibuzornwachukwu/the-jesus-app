'use client';

import Link from 'next/link';

const VERSE_FRAGMENTS = [
  { text: 'In the beginning was the Word', top: '8%',  left: '5%',  delay: '0s',   duration: '9s' },
  { text: 'The Lord is my shepherd',        top: '14%', left: '62%', delay: '1.4s', duration: '11s' },
  { text: 'For God so loved the world',     top: '28%', left: '78%', delay: '0.6s', duration: '10s' },
  { text: 'I am the way, the truth, the life', top: '38%', left: '2%', delay: '2.1s', duration: '12s' },
  { text: 'Be still and know that I am God',   top: '52%', left: '70%', delay: '0.9s', duration: '8s' },
  { text: 'His mercies are new every morning', top: '62%', left: '12%', delay: '1.7s', duration: '13s' },
  { text: 'Peace I leave with you',             top: '72%', left: '55%', delay: '0.3s', duration: '10s' },
  { text: 'Fear not, for I am with you',        top: '80%', left: '30%', delay: '2.5s', duration: '9s' },
  { text: 'Come to me, all who are weary',      top: '20%', left: '36%', delay: '1.1s', duration: '11s' },
  { text: 'The truth will set you free',         top: '88%', left: '68%', delay: '0.7s', duration: '14s' },
];

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes floatVerse {
          0%   { transform: translateY(0px);   opacity: 0.07; }
          40%  { opacity: 0.14; }
          50%  { transform: translateY(-14px); opacity: 0.14; }
          100% { transform: translateY(0px);   opacity: 0.07; }
        }
        @keyframes lp-fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-f1 { animation: lp-fadeUp 0.8s 0.00s ease both; }
        .lp-f2 { animation: lp-fadeUp 0.8s 0.18s ease both; }
        .lp-f3 { animation: lp-fadeUp 0.8s 0.34s ease both; }
        .lp-f4 { animation: lp-fadeUp 0.8s 0.50s ease both; }
        .lp-primary:hover { filter: brightness(1.12); }
        .lp-ghost:hover {
          border-color: var(--color-accent) !important;
          color: var(--color-accent) !important;
          background: var(--color-accent-soft) !important;
        }
        .lp-tile:hover { border-color: rgba(212,146,42,0.35) !important; }
      `}</style>

      <main style={{
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-sans)',
        overflowX: 'hidden',
      }}>

        {/* ══ S1 — CINEMATIC HERO ══════════════════════════════════════════ */}
        <section style={{
          position: 'relative',
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 1.5rem',
          overflow: 'hidden',
          background: 'var(--color-bg)',
        }}>

          {/* Floating verse fragments — decorative */}
          {VERSE_FRAGMENTS.map((v, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: v.top,
                left: v.left,
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 'clamp(0.65rem, 1.4vw, 0.85rem)',
                color: 'var(--color-text)',
                opacity: 0.07,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
                animation: `floatVerse ${v.duration} ${v.delay} ease-in-out infinite`,
              }}
            >
              {v.text}
            </span>
          ))}

          {/* Cross mark */}
          <div className="lp-f1" style={{ marginBottom: '1.25rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="10" y="2" width="4" height="20" rx="1.5" fill="var(--color-accent)" />
              <rect x="2"  y="8" width="20" height="4" rx="1.5" fill="var(--color-accent)" />
            </svg>
          </div>

          {/* Headline */}
          <h1 className="lp-f2" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(2.4rem, 6vw, 5.25rem)',
            lineHeight: 1.04,
            letterSpacing: '-0.025em',
            color: 'var(--color-text)',
            maxWidth: '820px',
            marginBottom: '1.25rem',
          }}>
            The Word. In your world.<br />Among your people.
          </h1>

          {/* Subline */}
          <p className="lp-f3" style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            lineHeight: 1.65,
            color: 'var(--color-text-muted)',
            maxWidth: '440px',
            marginBottom: '2.5rem',
          }}>
            A Kingdom community platform — built for believers who live it out.
          </p>

          {/* CTAs */}
          <div className="lp-f4" style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/sign-up" className="lp-primary" style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--color-accent-text)',
              background: 'var(--color-accent)',
              borderRadius: 'var(--radius-full)',
              padding: '0.875rem 2rem',
              textDecoration: 'none',
              transition: 'filter 0.15s',
              display: 'inline-block',
            }}>
              Get Started
            </Link>
            <Link href="/sign-in" className="lp-ghost" style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: '0.875rem 2rem',
              textDecoration: 'none',
              transition: 'border-color 0.15s, color 0.15s, background 0.15s',
              display: 'inline-block',
            }}>
              Sign In
            </Link>
          </div>
        </section>

        {/* ══ S2 — UI PREVIEW MOSAIC ═══════════════════════════════════════ */}
        <section style={{ background: 'var(--color-surface)', padding: '5rem 1.5rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
            letterSpacing: '-0.02em',
            textAlign: 'center',
            color: 'var(--color-text)',
            marginBottom: '3rem',
          }}>
            What it looks like inside
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            maxWidth: '1000px',
            margin: '0 auto',
          }}>

            {/* Tile A — Community */}
            <div className="lp-tile" style={{
              background: 'var(--color-surface-high)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              transition: 'border-color 0.2s',
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                Community
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-faint)', marginBottom: '0.875rem' }}>
                # general
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--color-accent-soft)', border: '1px solid var(--color-border)',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', color: 'var(--color-accent)',
                  fontFamily: 'var(--font-display)', fontWeight: 900,
                }}>PJ</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text)' }}>
                      Pastor James
                    </span>
                    <span style={{ background: 'var(--color-accent)', color: 'var(--color-accent-text)', fontSize: '0.6rem', fontWeight: 700, borderRadius: '999px', padding: '0.1rem 0.45rem' }}>
                      3
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    "Let's dig into Romans 8 tonight — who's joining the call?"
                  </p>
                </div>
              </div>
            </div>

            {/* Tile B — Verse Feed */}
            <div className="lp-tile" style={{
              background: 'var(--color-surface-high)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              transition: 'border-color 0.2s',
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                Explore
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1rem', lineHeight: 1.7, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                "For I know the plans I have for you, declares the Lord — plans to prosper you."
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '1.25rem' }}>
                Jeremiah 29:11
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[{ icon: '♥', val: '24' }, { icon: '💬', val: '6' }, { icon: '🔖', val: '' }].map((a, i) => (
                  <span key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--color-text-faint)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>{a.icon}</span>{a.val && <span>{a.val}</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Tile C — Learn */}
            <div className="lp-tile" style={{
              background: 'var(--color-surface-high)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              transition: 'border-color 0.2s',
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                Learn
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.01em', color: 'var(--color-text)', marginBottom: '0.4rem' }}>
                Grace &amp; Identity
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Lesson 3 of 5 · Faith Courses
              </p>
              <div style={{ height: '5px', borderRadius: '99px', background: 'var(--color-border)', overflow: 'hidden', marginBottom: '1.25rem' }}>
                <div style={{ width: '60%', height: '100%', background: 'var(--color-accent)', borderRadius: '99px' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                Continue →
              </span>
            </div>

          </div>
        </section>

        {/* ══ S3 — MISSION ════════════════════════════════════════════════ */}
        <section style={{ background: 'var(--color-faint-bg)', padding: '5rem 1.5rem' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <blockquote style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 'clamp(1.1rem, 2.8vw, 1.4rem)',
              lineHeight: 1.75,
              color: 'var(--color-text)',
              margin: '0 0 3.5rem',
              padding: 0,
              border: 'none',
            }}>
              "The JESUS App exists to empower believers, foster collaboration,
              cultivate discipleship, and reflect Christ in digital culture."
            </blockquote>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2rem',
              textAlign: 'left',
            }}>
              {[
                {
                  label: 'Engage',
                  body: 'Real communities built around scripture — cells, channels, and honest conversations with believers near and far.',
                },
                {
                  label: 'Explore',
                  body: 'A feed of short-form scripture perspectives, testimonies, and daily verses — curated for reflection, not distraction.',
                },
                {
                  label: 'Learn',
                  body: 'Faith courses, AI-powered spiritual guidance, and sermon extraction — so the Word goes deeper than the pew.',
                },
              ].map((p) => (
                <div key={p.label}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.35rem', letterSpacing: '-0.01em', color: 'var(--color-accent)', marginBottom: '0.6rem' }}>
                    {p.label}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--color-text-muted)', margin: 0 }}>
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ S4 — FINAL CTA ══════════════════════════════════════════════ */}
        <section style={{
          position: 'relative',
          background: 'var(--color-bg)',
          padding: '7rem 1.5rem 8rem',
          textAlign: 'center',
          overflow: 'hidden',
        }}>
          {/* Orange radial glow from below */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '700px',
            height: '320px',
            background: 'radial-gradient(ellipse at center bottom, rgba(212,146,42,0.22) 0%, transparent 68%)',
            pointerEvents: 'none',
          }} />
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            letterSpacing: '-0.025em',
            lineHeight: 1.06,
            color: 'var(--color-text)',
            marginBottom: '2rem',
            position: 'relative',
          }}>
            Your community is waiting.
          </h2>
          <Link href="/sign-up" className="lp-primary" style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--color-accent-text)',
            background: 'var(--color-accent)',
            borderRadius: 'var(--radius-full)',
            padding: '1rem 2.5rem',
            textDecoration: 'none',
            display: 'inline-block',
            transition: 'filter 0.15s',
            position: 'relative',
          }}>
            Get Started
          </Link>
        </section>

        {/* ══ FOOTER ══════════════════════════════════════════════════════ */}
        <footer style={{
          borderTop: '1px solid var(--color-border)',
          padding: '1.75rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.875rem',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.06em', color: 'var(--color-accent)' }}>
              THE JESUS APP
            </span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>
              01/03/2026
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Terms & Conditions', href: '/terms' },
              { label: 'Privacy Policy',     href: '/privacy' },
              { label: 'Purity Policy',      href: '/purity' },
            ].map((l) => (
              <Link key={l.label} href={l.href} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--color-text-faint)', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-text-faint)', margin: 0 }}>
            Not affiliated with any denomination. Scripture-based. Christ-centred.
          </p>
        </footer>

      </main>
    </>
  );
}
