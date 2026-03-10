'use client';

import React, { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { Search, X, Users } from 'lucide-react';
import { UserCard } from '../../../libs/profile/UserCard';
import { searchUsers } from '../../../lib/profile/actions';
import { Skeleton } from '../../../libs/shared-ui/Skeleton';
import type { ProfileSummary } from '../../../libs/profile/types';

const DEBOUNCE_MS = 320;

export function DiscoverClient() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    startTransition(async () => {
      const data = await searchUsers(q.trim(), 30);
      setResults(data);
      setSearched(true);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => doSearch(query), DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch]);

  useEffect(() => {
    // Auto-focus search input on mount
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

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
          flexShrink: 0,
          gap: 'var(--space-2)',
        }}
      >
        <h1
          style={{
            flex: 1,
            margin: 0,
            fontFamily: "'Archivo Condensed', var(--font-display)",
            fontSize: '1.6rem',
            fontWeight: 900,
            letterSpacing: '-0.01em',
            color: 'var(--color-text)',
            lineHeight: 1,
          }}
        >
          Discover People
        </h1>
      </div>

      {/* ── Search bar ── */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            padding: '0 14px',
            height: 40,
            transition: 'border-color 0.15s',
          }}
        >
          <Search size={16} color="var(--color-text-muted)" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or bio…"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              caretColor: 'var(--color-accent)',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {loading && (
          <>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </>
        )}

        {!loading && searched && results.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-10) var(--space-4)',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
            }}
          >
            <Users size={40} strokeWidth={1.2} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>No people found</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>Try a different name or keyword</p>
            </div>
          </div>
        )}

        {!loading && !searched && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-10) var(--space-4)',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
            }}
          >
            <Users size={40} strokeWidth={1.2} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>Find your community</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>Search for people by username or bio</p>
            </div>
          </div>
        )}

        {!loading && results.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
