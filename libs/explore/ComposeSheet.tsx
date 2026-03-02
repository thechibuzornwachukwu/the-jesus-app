'use client';

import React, { useState, useRef, useTransition } from 'react';
import { ImageIcon, Video, BookOpen, X } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { createPost } from '../../lib/explore/actions';

type AttachFile = { file: File; previewUrl: string; kind: 'image' | 'video' };

interface ComposeSheetProps {
  open: boolean;
  onClose: () => void;
  onUploaded?: (id: string, kind: 'video' | 'post' | 'image') => void | Promise<void>;
}

const MAX_TEXT = 1000;
const MAX_VIDEO_MB = 100;
const MAX_IMAGE_MB = 10;
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];

export function ComposeSheet({ open, onClose, onUploaded }: ComposeSheetProps) {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<AttachFile | null>(null);
  const [scriptureOpen, setScriptureOpen] = useState(false);
  const [verseRef, setVerseRef] = useState('');
  const [verseText, setVerseText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const charsLeft = MAX_TEXT - text.length;

  // ── File picking ─────────────────────────────────────────────────────────

  const pickFile = (f: File, kind: 'image' | 'video') => {
    setError('');
    if (kind === 'video') {
      if (!ALLOWED_VIDEO.includes(f.type)) { setError('Only MP4, WebM, or MOV videos allowed.'); return; }
      if (f.size > MAX_VIDEO_MB * 1024 * 1024) { setError(`Video must be under ${MAX_VIDEO_MB} MB.`); return; }
    } else {
      if (!ALLOWED_IMAGE.includes(f.type)) { setError('Only JPEG, PNG, or WebP images allowed.'); return; }
      if (f.size > MAX_IMAGE_MB * 1024 * 1024) { setError(`Image must be under ${MAX_IMAGE_MB} MB.`); return; }
    }
    if (attachment) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment({ file: f, previewUrl: URL.createObjectURL(f), kind });
  };

  const removeAttachment = () => {
    if (attachment) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
  };

  // ── Reset / close ────────────────────────────────────────────────────────

  const reset = () => {
    if (attachment) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
    setText('');
    setVerseRef('');
    setVerseText('');
    setScriptureOpen(false);
    setError('');
    setUploading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Publish ──────────────────────────────────────────────────────────────

  const handlePublish = () => {
    if (!text.trim() && !attachment) { setError('Add text or an attachment.'); return; }
    setError('');
    setUploading(true);

    if (attachment) {
      startTransition(async () => {
        const form = new FormData();
        form.append('file', attachment.file);
        form.append('type', attachment.kind);
        form.append('caption', text.trim());
        form.append('verse_reference', verseRef.trim());
        form.append('verse_text', verseText.trim());

        const res = await fetch('/api/explore/upload', { method: 'POST', body: form });
        const json = await res.json();
        setUploading(false);

        if (!res.ok || json.error) { setError(json.error ?? 'Upload failed. Please try again.'); return; }
        const id: string = attachment.kind === 'video' ? json.videoId : json.postId;
        const kind = attachment.kind;
        reset();
        onClose();
        onUploaded?.(id, kind);
      });
      return;
    }

    // text-only post
    startTransition(async () => {
      const result = await createPost(
        text,
        verseRef.trim() || undefined,
        verseText.trim() || undefined,
      );
      setUploading(false);
      if ('error' in result) { setError(result.error); return; }
      reset();
      onClose();
      onUploaded?.(result.postId, 'post');
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <BottomSheet open={open} onClose={handleClose} title="New Witness Post">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

        {/* Text area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
          placeholder="What's on your heart?"
          rows={4}
          className="field-textarea"
          style={{ resize: 'none' }}
        />

        {/* Attachment preview */}
        {attachment && (
          <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--color-surface)' }}>
            {attachment.kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachment.previewUrl}
                alt="Preview"
                style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <video
                src={attachment.previewUrl}
                style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                muted playsInline controls={false}
              />
            )}
            <button
              onClick={removeAttachment}
              aria-label="Remove attachment"
              style={{
                position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)',
                width: 28, height: 28, borderRadius: 'var(--radius-full)',
                background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Scripture fields */}
        {scriptureOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <input
              value={verseRef}
              onChange={(e) => setVerseRef(e.target.value)}
              placeholder="e.g. John 3:16"
              maxLength={80}
              className="field-input"
            />
            <textarea
              value={verseText}
              onChange={(e) => setVerseText(e.target.value)}
              placeholder="Paste the verse text here…"
              maxLength={600}
              rows={2}
              className="field-textarea"
              style={{ resize: 'none' }}
            />
          </div>
        )}

        {error && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error)', margin: 0, textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
          {/* Image picker — hidden if video attached */}
          {attachment?.kind !== 'video' && (
            <ToolBtn
              label="Attach image"
              active={attachment?.kind === 'image'}
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon size={18} />
            </ToolBtn>
          )}

          {/* Video picker — hidden if image attached */}
          {attachment?.kind !== 'image' && (
            <ToolBtn
              label="Attach video"
              active={attachment?.kind === 'video'}
              onClick={() => videoInputRef.current?.click()}
            >
              <Video size={18} />
            </ToolBtn>
          )}

          <ToolBtn label="Tag scripture" active={scriptureOpen} onClick={() => setScriptureOpen((v) => !v)}>
            <BookOpen size={18} />
          </ToolBtn>

          {/* Spacer + char counter */}
          <span style={{ flex: 1 }} />
          <span style={{
            fontSize: 'var(--font-size-xs)',
            color: charsLeft < 50 ? 'var(--color-error)' : 'var(--color-text-muted)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {charsLeft}
          </span>

          {/* Post button */}
          <button
            onClick={handlePublish}
            disabled={uploading}
            style={{
              padding: 'var(--space-2) var(--space-5)',
              borderRadius: 'var(--radius-full)',
              background: uploading ? 'var(--color-border)' : 'var(--color-accent)',
              border: 'none',
              color: uploading ? 'var(--color-text-muted)' : 'var(--color-accent-text)',
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-size-sm)',
              cursor: uploading ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {uploading ? 'Posting…' : 'Post'}
          </button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f, 'image'); e.target.value = ''; }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f, 'video'); e.target.value = ''; }}
        />
      </div>
    </BottomSheet>
  );
}

function ToolBtn({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 36, height: 36, borderRadius: 'var(--radius-full)', border: 'none',
        background: active ? 'var(--color-accent-soft)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {children}
    </button>
  );
}
