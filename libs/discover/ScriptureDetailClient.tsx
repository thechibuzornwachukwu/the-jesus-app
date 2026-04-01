'use client';

// Stage 4D — Scripture detail: verse text, translation selector, video + testimony stubs

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Video,
  MessageSquareText,
  Heart,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { vibrate } from '../shared-ui/haptics';
import { showToast } from '../shared-ui/Toast';
import { Avatar } from '../shared-ui/Avatar';
import { Skeleton } from '../shared-ui/Skeleton';
import { saveVerse } from '../../lib/explore/actions';
import { getPostsByVerseTag } from '../../lib/discover/actions';
import type { DiscoverPost } from '../../lib/discover/actions';

type Translation = 'NIV' | 'KJV' | 'ESV';

const TRANSLATIONS: Translation[] = ['NIV', 'KJV', 'ESV'];

// Stub: for now all translations show the same text.
// Phase 8 will wire real translation API.
function getTranslationText(text: string, _translation: Translation): string {
  return text;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function TestimonyRow({ post }: { post: DiscoverPost }) {
  return (
    <article style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-2)' }}>
        <Avatar src={post.author?.avatar_url ?? null} name={post.author?.username ?? '?'} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            @{post.author?.username ?? 'unknown'}
          </p>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-faint)', flexShrink: 0 }}>
          {timeAgo(post.created_at)}
        </span>
      </div>
      {post.content && (
        <p
          style={{
            margin: '0 0 var(--space-2)',
            fontSize: 14,
            color: 'var(--color-text)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}
        >
          {post.content}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
          <Heart size={12} aria-hidden /> {post.like_count}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
          <MessageCircle size={12} aria-hidden /> {post.comment_count}
        </span>
      </div>
    </article>
  );
}

function EmptySection({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--space-8) var(--space-6)',
        gap: 'var(--space-2)',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
      }}
    >
      {icon}
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 12 }}>{sub}</p>
    </div>
  );
}

interface ScriptureDetailClientProps {
  verseRef: string;
  verseText: string | null;
  initialTestimonies: DiscoverPost[];
  initialCursor: string | null;
}

export function ScriptureDetailClient({
  verseRef,
  verseText,
  initialTestimonies,
  initialCursor,
}: ScriptureDetailClientProps) {
  const router = useRouter();
  const [translation, setTranslation] = useState<Translation>('NIV');
  const [saved, setSaved] = useState(false);
  const [testimonies, setTestimonies] = useState(initialTestimonies);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [, startTransition] = useTransition();

  const displayText = verseText ? getTranslationText(verseText, translation) : null;

  function handleBack() {
    vibrate([6]);
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => router.back());
    } else {
      router.back();
    }
  }

  function handleSave() {
    if (saved || !verseText) return;
    vibrate([8]);
    setSaved(true);
    startTransition(async () => {
      const result = await saveVerse(verseRef, verseText);
      if (result?.error) {
        setSaved(false);
        showToast('Could not save verse', 'error');
      } else {
        showToast('Verse saved!', 'success');
      }
    });
  }

  async function loadMore() {
    if (loadingMore || !cursor) return;
    setLoadingMore(true);
    const { posts: more, nextCursor } = await getPostsByVerseTag(verseRef, cursor);
    setTestimonies((prev) => [...prev, ...more]);
    setCursor(nextCursor);
    setLoadingMore(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Sticky header ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-4)',
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          gap: 'var(--space-3)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleBack}
          aria-label="Back"
          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          <ArrowLeft size={20} aria-hidden />
        </button>

        <h1
          style={{
            flex: 1,
            margin: 0,
            fontFamily: "'Archivo Condensed', var(--font-display)",
            fontSize: '1.4rem',
            fontWeight: 900,
            letterSpacing: '-0.01em',
            color: 'var(--color-text)',
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {verseRef}
        </h1>

        {verseText && (
          <button
            onClick={handleSave}
            aria-label={saved ? 'Verse saved' : 'Save verse'}
            style={{
              background: saved ? 'var(--color-accent-soft)' : 'var(--color-surface)',
              border: `1px solid ${saved ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-full)',
              padding: '6px 12px',
              cursor: saved ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 700,
              color: saved ? 'var(--color-accent)' : 'var(--color-text-muted)',
              flexShrink: 0,
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saved ? <BookmarkCheck size={13} aria-hidden /> : <Bookmark size={13} aria-hidden />}
            {saved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── Verse text (hero) ── */}
        {displayText ? (
          <div
            style={{
              padding: 'var(--space-8) var(--space-5)',
              textAlign: 'center',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <p
              style={{
                margin: '0 0 var(--space-3)',
                fontFamily: "'Lora', var(--font-serif)",
                fontSize: 20,
                lineHeight: 1.75,
                color: 'var(--color-text)',
                fontStyle: 'italic',
              }}
            >
              &ldquo;{displayText}&rdquo;
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--color-accent)',
                letterSpacing: '0.02em',
              }}
            >
              — {verseRef}
            </p>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Verse text not available
            </p>
          </div>
        )}

        {/* ── Translation selector ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Translation</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {TRANSLATIONS.map((t) => (
              <button
                key={t}
                onClick={() => { vibrate([4]); setTranslation(t); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: translation === t ? 'none' : '1px solid var(--color-border)',
                  background: translation === t ? 'var(--color-accent)' : 'transparent',
                  color: translation === t ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.12s',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {translation !== 'NIV' && (
            <span style={{ fontSize: 11, color: 'var(--color-text-faint)', fontStyle: 'italic' }}>
              (coming soon)
            </span>
          )}
        </div>

        {/* ── Videos about this verse ── */}
        <section style={{ borderBottom: '1px solid var(--color-border)' }}>
          <p
            style={{
              margin: 0,
              padding: 'var(--space-3) var(--space-4) 0',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            Videos about this verse
          </p>
          <EmptySection
            icon={<Video size={32} strokeWidth={1.2} color="var(--color-text-faint)" />}
            label="No videos yet"
            sub="Videos tagged with this verse will appear here"
          />
        </section>

        {/* ── Testimonies referencing this verse ── */}
        <section>
          <p
            style={{
              margin: 0,
              padding: 'var(--space-3) var(--space-4) 0',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            Testimonies
          </p>

          {testimonies.length === 0 ? (
            <EmptySection
              icon={<MessageSquareText size={32} strokeWidth={1.2} color="var(--color-text-faint)" />}
              label="No testimonies yet"
              sub={`Be the first to share a thought on ${verseRef}`}
            />
          ) : (
            <>
              {testimonies.map((p) => <TestimonyRow key={p.id} post={p} />)}

              {loadingMore && (
                <div style={{ padding: 'var(--space-4)' }}>
                  {[0, 1].map((i) => (
                    <Skeleton key={i} style={{ height: 90, borderRadius: 'var(--radius-md)', marginBottom: 8 }} />
                  ))}
                </div>
              )}

              {cursor && !loadingMore && (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                  <button
                    onClick={loadMore}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-border)',
                      background: 'transparent',
                      color: 'var(--color-text-muted)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <RefreshCw size={13} aria-hidden />
                    Load more
                  </button>
                </div>
              )}

              {!cursor && testimonies.length > 0 && (
                <p style={{ textAlign: 'center', padding: 'var(--space-4)', fontSize: 12, color: 'var(--color-text-faint)', margin: 0 }}>
                  All testimonies loaded
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
