'use client';

import React, { useState, useRef, useTransition } from 'react';
import { Video, BookOpen, X } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';

const MAX_CAPTION = 1000;
const MAX_VIDEO_MB = 100;
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];

interface ComposeSheetProps {
  open: boolean;
  onClose: () => void;
  onUploaded?: (id: string, kind: 'video') => void | Promise<void>;
}

export function ComposeSheet({ open, onClose, onUploaded }: ComposeSheetProps) {
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState<{ file: File; previewUrl: string } | null>(null);
  const [scriptureOpen, setScriptureOpen] = useState(false);
  const [verseRef, setVerseRef] = useState('');
  const [verseText, setVerseText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  const videoInputRef = useRef<HTMLInputElement>(null);
  const charsLeft = MAX_CAPTION - caption.length;

  const pickVideo = (f: File) => {
    setError('');
    if (!ALLOWED_VIDEO.includes(f.type)) { setError('Only MP4, WebM, or MOV videos allowed.'); return; }
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) { setError(`Video must be under ${MAX_VIDEO_MB} MB.`); return; }
    if (videoFile) URL.revokeObjectURL(videoFile.previewUrl);
    setVideoFile({ file: f, previewUrl: URL.createObjectURL(f) });
  };

  const removeVideo = () => {
    if (videoFile) URL.revokeObjectURL(videoFile.previewUrl);
    setVideoFile(null);
  };

  const reset = () => {
    if (videoFile) URL.revokeObjectURL(videoFile.previewUrl);
    setVideoFile(null);
    setCaption('');
    setVerseRef('');
    setVerseText('');
    setScriptureOpen(false);
    setError('');
    setUploading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handlePublish = () => {
    if (!videoFile) { setError('Please attach a video.'); return; }
    setError('');
    setUploading(true);

    startTransition(async () => {
      const form = new FormData();
      form.append('file', videoFile.file);
      form.append('type', 'video');
      form.append('caption', caption.trim());
      form.append('verse_reference', verseRef.trim());
      form.append('verse_text', verseText.trim());

      const res = await fetch('/api/explore/upload', { method: 'POST', body: form });
      const json = await res.json();
      setUploading(false);

      if (!res.ok || json.error) { setError(json.error ?? 'Upload failed. Please try again.'); return; }
      const id: string = json.videoId;
      reset();
      onClose();
      onUploaded?.(id, 'video');
    });
  };

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="Upload Video"
      contentScrollable={false}
      contentStyle={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Scrollable body — grows, shrinks, scrolls if keyboard pushes space */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        padding: 'var(--space-4) var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}>

        {/* Video preview / picker */}
        {videoFile ? (
          <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--color-surface)' }}>
            <video
              src={videoFile.previewUrl}
              style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
              muted playsInline controls={false}
            />
            <button
              onClick={removeVideo}
              aria-label="Remove video"
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
        ) : (
          <button
            onClick={() => videoInputRef.current?.click()}
            style={{
              width: '100%', height: 120, borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--color-border)', background: 'var(--color-surface)',
              color: 'var(--color-text-muted)', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)',
            }}
          >
            <Video size={28} />
            Tap to select a video
          </button>
        )}

        {/* Caption */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
          placeholder="Add a caption…"
          rows={3}
          className="field-textarea"
          style={{ resize: 'none' }}
        />

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
      </div>

      {/* Sticky toolbar — always visible above keyboard */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-3) var(--space-6)',
        paddingBottom: 'calc(var(--safe-bottom, 0px) + var(--space-3))',
        background: 'var(--color-bg-surface)',
      }}>
        <ToolBtn label="Tag scripture" active={scriptureOpen} onClick={() => setScriptureOpen((v) => !v)}>
          <BookOpen size={18} />
        </ToolBtn>

        <span style={{ flex: 1 }} />
        <span style={{
          fontSize: 'var(--font-size-xs)',
          color: charsLeft < 50 ? 'var(--color-error)' : 'var(--color-text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {charsLeft}
        </span>

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
          {uploading ? 'Uploading…' : 'Post'}
        </button>
      </div>

      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) pickVideo(f); e.target.value = ''; }}
      />
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
