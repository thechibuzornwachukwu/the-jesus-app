'use client';

import React, { useState, useRef, useTransition } from 'react';
import { Video, Upload, FileText } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { createPost } from '../../lib/explore/actions';

type Mode = 'video' | 'post';

interface UploadSheetProps {
  open: boolean;
  onClose: () => void;
  onUploaded?: (id: string, kind: 'video' | 'post') => void;
}

const MAX_MB = 100;
const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime'];

export function UploadSheet({ open, onClose, onUploaded }: UploadSheetProps) {
  const [mode, setMode] = useState<Mode>('video');

  // Video state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [videoCaption, setVideoCaption] = useState('');
  const [videoVerseRef, setVideoVerseRef] = useState('');
  const [videoVerseText, setVideoVerseText] = useState('');
  const [uploading, setUploading] = useState(false);

  // Post state
  const [postContent, setPostContent] = useState('');
  const [postVerseRef, setPostVerseRef] = useState('');
  const [postVerseText, setPostVerseText] = useState('');
  const [publishing, setPublishing] = useState(false);

  const [error, setError] = useState('');
  const [, startTransition] = useTransition();
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
    setVideoCaption('');
    setVideoVerseRef('');
    setVideoVerseText('');
    setPostContent('');
    setPostVerseRef('');
    setPostVerseText('');
    setError('');
    setUploading(false);
    setPublishing(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handlePublishVideo = () => {
    if (!file) return;
    setUploading(true);
    startTransition(async () => {
      const form = new FormData();
      form.append('file', file);
      form.append('caption', videoCaption.trim());
      form.append('verse_reference', videoVerseRef.trim());
      form.append('verse_text', videoVerseText.trim());

      const res = await fetch('/api/explore/upload', { method: 'POST', body: form });
      const json = await res.json();
      setUploading(false);

      if (!res.ok || json.error) {
        setError(json.error ?? 'Upload failed. Please try again.');
        return;
      }
      reset();
      onClose();
      onUploaded?.(json.videoId, 'video');
    });
  };

  const handlePublishPost = async () => {
    if (!postContent.trim()) return;
    setPublishing(true);
    setError('');
    const result = await createPost(
      postContent,
      postVerseRef.trim() || undefined,
      postVerseText.trim() || undefined
    );
    setPublishing(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    reset();
    onClose();
    onUploaded?.(result.postId, 'post');
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: 'var(--space-2) var(--space-3)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    background: active ? 'var(--color-accent)' : 'none',
    color: active ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
    fontWeight: active ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
    fontSize: 'var(--font-size-sm)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-1)',
    transition: 'background 0.15s, color 0.15s',
  });

  return (
    <BottomSheet open={open} onClose={handleClose} title="Share a Perspective">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* Mode tab switcher */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-1)',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-1)',
            border: '1px solid var(--color-border)',
          }}
        >
          <button style={tabStyle(mode === 'video')} onClick={() => { setMode('video'); setError(''); }}>
            <Video size={15} />
            Video Perspective
          </button>
          <button style={tabStyle(mode === 'post')} onClick={() => { setMode('post'); setError(''); }}>
            <FileText size={15} />
            Text Post
          </button>
        </div>

        {/* ── VIDEO MODE ─────────────────────────────────────────────── */}
        {mode === 'video' && (
          <>
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
                  muted playsInline controls={false}
                />
                <button
                  onClick={reset}
                  style={{
                    position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)',
                    width: 28, height: 28, borderRadius: 'var(--radius-full)',
                    background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
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

            <FieldGroup label="Caption">
              <textarea
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                placeholder="Share what God is doing…"
                maxLength={300}
                rows={2}
                style={textareaStyle}
              />
            </FieldGroup>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={labelStyle}>Tag a Scripture (optional)</label>
              <input
                value={videoVerseRef}
                onChange={(e) => setVideoVerseRef(e.target.value)}
                placeholder="e.g. John 3:16"
                maxLength={80}
                style={inputStyle}
              />
              <textarea
                value={videoVerseText}
                onChange={(e) => setVideoVerseText(e.target.value)}
                placeholder="Paste the verse text here…"
                maxLength={600}
                rows={2}
                style={textareaStyle}
              />
            </div>

            {error && <ErrorMsg msg={error} />}

            <button
              onClick={handlePublishVideo}
              disabled={!file || uploading}
              style={publishBtnStyle(!file || uploading)}
            >
              {uploading ? 'Publishing…' : 'Publish Perspective'}
            </button>
          </>
        )}

        {/* ── POST MODE ──────────────────────────────────────────────── */}
        {mode === 'post' && (
          <>
            <FieldGroup label={`Post (${postContent.length}/1000)`}>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value.slice(0, 1000))}
                placeholder="Share what's on your heart…"
                rows={5}
                style={textareaStyle}
              />
            </FieldGroup>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={labelStyle}>Tag a Scripture (optional)</label>
              <input
                value={postVerseRef}
                onChange={(e) => setPostVerseRef(e.target.value)}
                placeholder="e.g. Psalm 23:1"
                maxLength={80}
                style={inputStyle}
              />
              <textarea
                value={postVerseText}
                onChange={(e) => setPostVerseText(e.target.value)}
                placeholder="Paste the verse text here…"
                maxLength={600}
                rows={2}
                style={textareaStyle}
              />
            </div>

            {error && <ErrorMsg msg={error} />}

            <button
              onClick={handlePublishPost}
              disabled={!postContent.trim() || publishing}
              style={publishBtnStyle(!postContent.trim() || publishing)}
            >
              {publishing ? 'Publishing…' : 'Publish Post'}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

// ── shared micro-components ────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error)', textAlign: 'center', margin: 0 }}>
      {msg}
    </p>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-weight-semibold)',
  display: 'block',
  marginBottom: 'var(--space-1)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-bg-primary)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-2) var(--space-3)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)',
  outline: 'none',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
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
  boxSizing: 'border-box',
};

const publishBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-full)',
  background: disabled ? 'var(--color-border)' : 'var(--color-accent)',
  border: 'none',
  color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
  fontSize: 'var(--font-size-base)',
  fontWeight: 'var(--font-weight-semibold)',
  cursor: disabled ? 'default' : 'pointer',
  transition: 'background 0.2s',
});
