'use client';

// Stage 5A — Full-screen search overlay with recent searches

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, ArrowLeft } from 'lucide-react';
import { vibrate } from '../shared-ui/haptics';
import { SearchResults } from './SearchResults';

const STORAGE_KEY = 'discover_recent_searches';
const MAX_RECENTS = 8;

function getRecents(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  try {
    const prev = getRecents().filter((r) => r !== query);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([query, ...prev].slice(0, MAX_RECENTS)));
  } catch {
    // ignore
  }
}

function clearRecents() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface SearchOverlayProps {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [committed, setCommitted] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recents on mount + auto-focus
  useEffect(() => {
    setRecents(getRecents());
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  // Debounce 200ms → commit query for SearchResults
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (!q) { setCommitted(''); return; }
    timerRef.current = setTimeout(() => {
      setCommitted(q);
      saveRecent(q);
      setRecents(getRecents());
    }, 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  function handleRecentTap(r: string) {
    vibrate([6]);
    setQuery(r);
    setCommitted(r);
  }

  function handleClearRecents() {
    clearRecents();
    setRecents([]);
  }

  function handleClose() {
    vibrate([4]);
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.22s cubic-bezier(0.32,0,0.67,0)',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0.6; }
          to   { transform: translateY(0);    opacity: 1;   }
        }
      `}</style>

      {/* ── Sticky search header ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px var(--space-4)',
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        {/* Back */}
        <button
          onClick={handleClose}
          aria-label="Close search"
          style={{
            background: 'none',
            border: 'none',
            padding: 4,
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={20} aria-hidden />
        </button>

        {/* Input container */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-full)',
            border: '1.5px solid var(--color-accent)',
            padding: '0 14px',
            height: 40,
          }}
        >
          <Search size={15} color="var(--color-text-muted)" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, verses, courses, books…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
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
              onClick={() => { setQuery(''); setCommitted(''); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text-muted)', display: 'flex' }}
              aria-label="Clear"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Recent searches — shown when input empty */}
        {!committed && recents.length > 0 && (
          <div style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Recent
              </span>
              <button
                onClick={handleClearRecents}
                style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-accent)', cursor: 'pointer', padding: 0 }}
              >
                Clear
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recents.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRecentTap(r)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 4px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--color-text)',
                    fontSize: 'var(--font-size-sm)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Clock size={14} color="var(--color-text-faint)" aria-hidden />
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when no query + no recents */}
        {!committed && recents.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-12) var(--space-6)',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <Search size={40} strokeWidth={1.2} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>Search the app</p>
            <p style={{ margin: 0, fontSize: 13 }}>Find people, verses, courses, and books</p>
          </div>
        )}

        {/* Search results */}
        {committed && <SearchResults query={committed} />}
      </div>
    </div>
  );
}
