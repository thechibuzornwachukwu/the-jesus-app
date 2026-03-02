'use client';

import React, { useState } from 'react';
import { Repeat2, Quote } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { createRepost } from '../../lib/explore/actions';
import { showToast } from '../shared-ui';

interface RepostSheetProps {
  open: boolean;
  onClose: () => void;
  originalId: string;
  originalType: 'video' | 'post';
  onReposted?: () => void;
}

export function RepostSheet({ open, onClose, originalId, originalType, onReposted }: RepostSheetProps) {
  const [quoting, setQuoting] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [verseText, setVerseText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setQuoting(false);
    setQuoteText('');
    setVerseRef('');
    setVerseText('');
    onClose();
  };

  const handleSilentRepost = async () => {
    setLoading(true);
    const result = await createRepost(originalId, originalType);
    setLoading(false);
    if ('error' in result) {
      showToast(result.error, 'error');
    } else {
      showToast('Reposted ↺', 'success');
      onReposted?.();
      handleClose();
    }
  };

  const handleQuoteRepost = async () => {
    if (!quoteText.trim()) {
      showToast('Add a quote to share your perspective', 'error');
      return;
    }
    setLoading(true);
    const result = await createRepost(
      originalId,
      originalType,
      quoteText.trim(),
      verseRef.trim() || undefined,
      verseText.trim() || undefined
    );
    setLoading(false);
    if ('error' in result) {
      showToast(result.error, 'error');
    } else {
      showToast('Quoted ↺', 'success');
      onReposted?.();
      handleClose();
    }
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="Share Perspective">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-2) 0 var(--space-4)' }}>
        {!quoting ? (
          <>
            <button
              onClick={handleSilentRepost}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: 'var(--color-text)',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Repeat2 size={22} color="var(--color-accent)" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-base)' }}>Repost</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Share to your feed instantly</div>
              </div>
            </button>

            <button
              onClick={() => setQuoting(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                cursor: 'pointer',
                color: 'var(--color-text)',
              }}
            >
              <Quote size={22} color="var(--color-accent)" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-base)' }}>Quote</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Add your perspective</div>
              </div>
            </button>
          </>
        ) : (
          <>
            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Add your perspective…"
              maxLength={500}
              rows={4}
              style={{
                width: '100%',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3)',
                color: 'var(--color-text)',
                fontSize: 'var(--font-size-base)',
                resize: 'none',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <input
              value={verseRef}
              onChange={(e) => setVerseRef(e.target.value)}
              placeholder="Scripture reference (optional)"
              maxLength={100}
              style={{
                width: '100%',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3)',
                color: 'var(--color-text)',
                fontSize: 'var(--font-size-sm)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <textarea
              value={verseText}
              onChange={(e) => setVerseText(e.target.value)}
              placeholder="Scripture text (optional)"
              maxLength={2000}
              rows={3}
              style={{
                width: '100%',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3)',
                color: 'var(--color-text)',
                fontSize: 'var(--font-size-sm)',
                resize: 'none',
                fontFamily: 'var(--font-serif, serif)',
                fontStyle: 'italic',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={() => setQuoting(false)}
                style={{
                  flex: 1,
                  padding: 'var(--space-3)',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Back
              </button>
              <button
                onClick={handleQuoteRepost}
                disabled={loading || !quoteText.trim()}
                style={{
                  flex: 2,
                  padding: 'var(--space-3)',
                  background: 'var(--color-accent)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--color-accent-text)',
                  cursor: loading || !quoteText.trim() ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  opacity: loading || !quoteText.trim() ? 0.6 : 1,
                }}
              >
                {loading ? 'Posting…' : 'Quote & Share'}
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
