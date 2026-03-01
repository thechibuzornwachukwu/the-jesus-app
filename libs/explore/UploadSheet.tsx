'use client';

import React, { useState, useRef, useTransition } from 'react';
import { Video, Upload, FileText, X, ImageIcon } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { createPost } from '../../lib/explore/actions';

type Mode = 'video' | 'post' | 'image';

interface UploadSheetProps {
  open: boolean;
  onClose: () => void;
  onUploaded?: (id: string, kind: "video" | "post" | "image") => void | Promise<void>;
}

const MAX_VIDEO_MB = 100;
const MAX_IMAGE_MB = 10;
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];

export function UploadSheet({ open, onClose, onUploaded }: UploadSheetProps) {
  const [mode, setMode] = useState<Mode>('video');

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoCaption, setVideoCaption] = useState('');
  const [videoVerseRef, setVideoVerseRef] = useState('');
  const [videoVerseText, setVideoVerseText] = useState('');
  const [uploading, setUploading] = useState(false);

  // Post state
  const [postContent, setPostContent] = useState('');
  const [postVerseRef, setPostVerseRef] = useState('');
  const [postVerseText, setPostVerseText] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [imageVerseRef, setImageVerseRef] = useState('');
  const [imageVerseText, setImageVerseText] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  const [error, setError] = useState('');
  const [, startTransition] = useTransition();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Video handlers ──────────────────────────────────────────────────────

  const handleVideoFile = (f: File) => {
    setError('');
    if (!ALLOWED_VIDEO.includes(f.type)) { setError('Only MP4, WebM, or MOV videos allowed.'); return; }
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) { setError(`File must be under ${MAX_VIDEO_MB} MB.`); return; }
    setVideoFile(f);
    setVideoPreview(URL.createObjectURL(f));
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleVideoFile(dropped);
  };

  // ── Image handlers ──────────────────────────────────────────────────────

  const handleImageFile = (f: File) => {
    setError('');
    if (!ALLOWED_IMAGE.includes(f.type)) { setError('Only JPEG, PNG, or WebP images allowed.'); return; }
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) { setError(`Image must be under ${MAX_IMAGE_MB} MB.`); return; }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleImageFile(dropped);
  };

  // ── Reset ───────────────────────────────────────────────────────────────

  const reset = () => {
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setVideoCaption('');
    setVideoVerseRef('');
    setVideoVerseText('');
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageCaption('');
    setImageVerseRef('');
    setImageVerseText('');
    setPostContent('');
    setPostVerseRef('');
    setPostVerseText('');
    setError('');
    setUploading(false);
    setPublishing(false);
    setImageUploading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Publish handlers ────────────────────────────────────────────────────

  const handlePublishVideo = () => {
    if (!videoFile) return;
    setUploading(true);
    startTransition(async () => {
      const form = new FormData();
      form.append('file', videoFile);
      form.append('type', 'video');
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

  const handlePublishImage = () => {
    if (!imageFile || !imageCaption.trim()) return;
    setImageUploading(true);
    startTransition(async () => {
      const form = new FormData();
      form.append('file', imageFile);
      form.append('type', 'image');
      form.append('caption', imageCaption.trim());
      form.append('verse_reference', imageVerseRef.trim());
      form.append('verse_text', imageVerseText.trim());

      const res = await fetch('/api/explore/upload', { method: 'POST', body: form });
      const json = await res.json();
      setImageUploading(false);

      if (!res.ok || json.error) {
        setError(json.error ?? 'Upload failed. Please try again.');
        return;
      }
      reset();
      onClose();
      onUploaded?.(json.postId, 'image');
    });
  };

  // ── Styles ──────────────────────────────────────────────────────────────

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
            Video
          </button>
          <button style={tabStyle(mode === 'image')} onClick={() => { setMode('image'); setError(''); }}>
            <ImageIcon size={15} />
            Image
          </button>
          <button style={tabStyle(mode === 'post')} onClick={() => { setMode('post'); setError(''); }}>
            <FileText size={15} />
            Text
          </button>
        </div>

        {/* ── VIDEO MODE ─────────────────────────────────────────────── */}
        {mode === 'video' && (
          <>
            {!videoFile ? (
              <div
                role="button"
                tabIndex={0}
                aria-label="Select a video to upload"
                onClick={() => videoInputRef.current?.click()}
                onDrop={handleVideoDrop}
                onDragOver={(e) => e.preventDefault()}
                onKeyDown={(e) => e.key === 'Enter' && videoInputRef.current?.click()}
                style={dropZoneStyle}
              >
                <Video size={36} color="var(--color-text-muted)" />
                <Upload size={20} color="var(--color-text-faint)" />
                <span>Tap to select a video</span>
                <span style={{ fontSize: 'var(--font-size-xs)' }}>MP4 · WebM · MOV · up to 100 MB</span>
              </div>
            ) : (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: 200 }}>
                <video
                  src={videoPreview ?? undefined}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  muted playsInline controls={false}
                />
                <RemoveButton onClick={() => { setVideoFile(null); if (videoPreview) URL.revokeObjectURL(videoPreview); setVideoPreview(null); }} />
              </div>
            )}

            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); }}
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
              <input value={videoVerseRef} onChange={(e) => setVideoVerseRef(e.target.value)} placeholder="e.g. John 3:16" maxLength={80} style={inputStyle} />
              <textarea value={videoVerseText} onChange={(e) => setVideoVerseText(e.target.value)} placeholder="Paste the verse text here…" maxLength={600} rows={2} style={textareaStyle} />
            </div>

            {error && <ErrorMsg msg={error} />}

            <button
              onClick={handlePublishVideo}
              disabled={!videoFile || uploading}
              style={publishBtnStyle(!videoFile || uploading)}
            >
              {uploading ? 'Publishing…' : 'Publish Perspective'}
            </button>
          </>
        )}

        {/* ── IMAGE MODE ─────────────────────────────────────────────── */}
        {mode === 'image' && (
          <>
            {!imageFile ? (
              <div
                role="button"
                tabIndex={0}
                aria-label="Select an image to upload"
                onClick={() => imageInputRef.current?.click()}
                onDrop={handleImageDrop}
                onDragOver={(e) => e.preventDefault()}
                onKeyDown={(e) => e.key === 'Enter' && imageInputRef.current?.click()}
                style={dropZoneStyle}
              >
                <ImageIcon size={36} color="var(--color-text-muted)" />
                <Upload size={20} color="var(--color-text-faint)" />
                <span>Tap to select an image</span>
                <span style={{ fontSize: 'var(--font-size-xs)' }}>JPEG · PNG · WebP · up to 10 MB</span>
              </div>
            ) : (
              <div
                style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                  background: 'var(--color-surface)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview ?? undefined}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <RemoveButton onClick={() => { setImageFile(null); if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null); }} />
              </div>
            )}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
            />

            <FieldGroup label={`Caption (${imageCaption.length}/300)`}>
              <textarea
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value.slice(0, 300))}
                placeholder="Share what God is doing…"
                rows={2}
                style={textareaStyle}
              />
            </FieldGroup>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={labelStyle}>Tag a Scripture (optional)</label>
              <input value={imageVerseRef} onChange={(e) => setImageVerseRef(e.target.value)} placeholder="e.g. Psalm 23:1" maxLength={80} style={inputStyle} />
              <textarea value={imageVerseText} onChange={(e) => setImageVerseText(e.target.value)} placeholder="Paste the verse text here…" maxLength={600} rows={2} style={textareaStyle} />
            </div>

            {error && <ErrorMsg msg={error} />}

            <button
              onClick={handlePublishImage}
              disabled={!imageFile || !imageCaption.trim() || imageUploading}
              style={publishBtnStyle(!imageFile || !imageCaption.trim() || imageUploading)}
            >
              {imageUploading ? 'Publishing…' : 'Publish Image'}
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
              <input value={postVerseRef} onChange={(e) => setPostVerseRef(e.target.value)} placeholder="e.g. Psalm 23:1" maxLength={80} style={inputStyle} />
              <textarea value={postVerseText} onChange={(e) => setPostVerseText(e.target.value)} placeholder="Paste the verse text here…" maxLength={600} rows={2} style={textareaStyle} />
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

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)',
        width: 28, height: 28, borderRadius: 'var(--radius-full)',
        background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      aria-label="Remove selected file"
    >
      <X size={14} />
    </button>
  );
}

const dropZoneStyle: React.CSSProperties = {
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
};

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
