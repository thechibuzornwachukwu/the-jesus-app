'use client';

import React from 'react';
import { Video, FileText, ExternalLink, User } from 'lucide-react';
import type { LinkPreview as LinkPreviewType } from '../../lib/chat/types';

interface Props {
  preview: LinkPreviewType;
}

export function LinkPreview({ preview }: Props) {
  const base: React.CSSProperties = {
    display: 'flex',
    gap: 'var(--space-2)',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    marginTop: 'var(--space-2)',
    textDecoration: 'none',
    cursor: 'pointer',
    maxWidth: 280,
  };

  if (preview.type === 'video') {
    return (
      <a href={preview.url} target="_blank" rel="noopener noreferrer" style={base}>
        {/* Thumbnail */}
        <div
          style={{
            width: 'var(--size-preview-thumb-w)',
            height: 'var(--size-preview-thumb-h)',
            flexShrink: 0,
            background: 'var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {preview.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.thumbnail_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Video size={20} style={{ color: 'var(--color-text-faint)' }} />
          )}
        </div>
        <div style={{ flex: 1, padding: 'var(--space-2)', minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text)',
              fontWeight: 'var(--font-weight-semibold)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {preview.title ?? 'Video'}
          </p>
          {preview.author_name && (
            <p style={{ margin: 'var(--space-0-5) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <User size={10} />
              {preview.author_name}
            </p>
          )}
          <p style={{ margin: 'var(--space-0-5) 0 0', fontSize: 'var(--font-size-2xs)', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Video
          </p>
        </div>
      </a>
    );
  }

  if (preview.type === 'testimony') {
    return (
      <a href={preview.url} target="_blank" rel="noopener noreferrer" style={base}>
        <div
          style={{
            width: 'var(--space-1-5)',
            flexShrink: 0,
            background: 'var(--color-accent)',
          }}
        />
        <div style={{ flex: 1, padding: 'var(--space-2)', minWidth: 0 }}>
          {preview.category && (
            <p style={{ margin: 0, fontSize: 'var(--font-size-2xs)', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              {preview.category}
            </p>
          )}
          {preview.excerpt && (
            <p
              style={{
                margin: 'var(--space-0-5) 0',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text)',
                lineHeight: 'var(--line-height-relaxed)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {preview.excerpt}
            </p>
          )}
          {preview.author_name && (
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <User size={10} />
              {preview.author_name}
            </p>
          )}
        </div>
        <div style={{ padding: 'var(--space-2)', display: 'flex', alignItems: 'flex-start' }}>
          <FileText size={14} style={{ color: 'var(--color-text-faint)' }} />
        </div>
      </a>
    );
  }

  // external
  return (
    <a href={preview.url} target="_blank" rel="noopener noreferrer" style={base}>
      {preview.og_image && (
        <div style={{ width: 'var(--size-preview-thumb-w)', height: 'var(--size-preview-thumb-h)', flexShrink: 0, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.og_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ flex: 1, padding: 'var(--space-2)', minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text)',
            fontWeight: 'var(--font-weight-semibold)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {preview.og_title ?? preview.url}
        </p>
        <p style={{ margin: 'var(--space-0-5) 0 0', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-faint)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <ExternalLink size={9} />
          {preview.url}
        </p>
      </div>
    </a>
  );
}
