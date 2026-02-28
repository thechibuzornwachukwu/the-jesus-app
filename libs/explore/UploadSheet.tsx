'use client';

import React, { useState, useRef, useTransition } from 'react';
import { Video, Upload } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';

interface UploadSheetProps {
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
}

const MAX_MB = 100;
const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime'];

export function UploadSheet({ open, onClose, onUploaded }: UploadSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [verseText, setVerseText] = useState('');
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setError('');
    if (!ALLOWED.includes(f.type)) { setError('Only MP4, WebM, or MOV videos allowed.'); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`File must be under ${MAX_MB} MB.`); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const reset = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCaption('');
    setVerseRef('');
    setVerseText('');
    setError('');
    setUploading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handlePublish = () => {
    if (!file) return;
    setUploading(true);
    startTransition(async () => {
      const form = new FormData();
      form.append('file', file);
      form.append('caption', caption.trim());
      form.append('verse_reference', verseRef.trim());
      form.append('verse_text', verseText.trim());

      const res = await fetch('/api/explore/upload', { method: 'POST', body: form });
      const json = await res.json();
      setUploading(false);

      if (!res.ok || json.error) {
        setError(json.error ?? 'Upload failed. Please try again.');
        return;
      }
      reset();
      onClose();
      onUploaded?.();
    });
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="Share a Perspective">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* Drop zone / preview */}
        {!file ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Select a video to upload"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            style={{
              height: 180,
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
              transition: 'border-color 0.15s',
            }}
          >
            <Video size={36} color="var(--color-text-muted)" />
            <Upload size={20} color="var(--color-text-faint)" />
            <span>Tap to select a video</span>
            <span style={{ fontSize: 'var(--font-size-xs)' }}>MP4 · WebM · MOV · up to 100 MB</span>
          </div>
        ) : (
          <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: 200 }}>
            <video
              src={preview ?? undefined}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              playsInline
              controls={false}
            />
            <button
              onClick={reset}
              style={{
                position: 'absolute',
                top: 'var(--space-2)',
                right: 'var(--space-2)',
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-remove-btn)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
              }}
              aria-label="Remove selected video"
            >
              ✕
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {/* Caption */}
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-semibold)', display: 'block', marginBottom: 'var(--space-1)' }}>
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share what God is doing…"
            maxLength={300}
            rows={2}
            style={{
              width: '100%',
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              resize: 'none',
              outline: 'none',
              lineHeight: 'var(--line-height-normal)',
            }}
          />
        </div>

        {/* Scripture tag */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-semibold)' }}>
            Tag a Scripture (optional)
          </label>
          <input
            value={verseRef}
            onChange={(e) => setVerseRef(e.target.value)}
            placeholder="e.g. John 3:16"
            maxLength={80}
            style={{
              width: '100%',
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-2) var(--space-3)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
            }}
          />
          <textarea
            value={verseText}
            onChange={(e) => setVerseText(e.target.value)}
            placeholder="Paste the verse text here…"
            maxLength={600}
            rows={2}
            style={{
              width: '100%',
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              resize: 'none',
              outline: 'none',
              lineHeight: 'var(--line-height-normal)',
            }}
          />
        </div>

        {error && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error)', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button
          onClick={handlePublish}
          disabled={!file || uploading}
          style={{
            width: '100%',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-full)',
            background: file && !uploading ? 'var(--color-accent)' : 'var(--color-border)',
            border: 'none',
            color: file && !uploading ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: file && !uploading ? 'pointer' : 'default',
            transition: 'background 0.2s',
          }}
        >
          {uploading ? 'Publishing…' : 'Publish Perspective'}
        </button>
      </div>
    </BottomSheet>
  );
}
