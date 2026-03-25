'use client';

import React, { useState, useRef, useTransition, useEffect, useCallback } from 'react';
import { Video, BookOpen, X, Search } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { searchVerses } from '../../lib/discover/actions';
import type { VerseResult } from '../../lib/discover/actions';

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
  // Verse tag state
  const [verseQuery, setVerseQuery] = useState('');
  const [verseResults, setVerseResults] = useState<VerseResult[]>([]);
  const [verseLoading, setVerseLoading] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<VerseResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  const videoInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charsLeft = MAX_CAPTION - caption.length;

  // Debounced verse search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!verseQuery.trim() || selectedVerse) {
      setVerseResults([]);
      setVerseLoading(false);
      return;
    }
    setVerseLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchVerses(verseQuery.trim());
      setVerseResults(results);
      setVerseLoading(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [verseQuery, selectedVerse]);

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

  const selectVerse = useCallback((v: VerseResult) => {
    setSelectedVerse(v);
    setVerseQuery('');
    setVerseResults([]);
  }, []);

  const clearVerse = useCallback(() => {
    setSelectedVerse(null);
    setVerseQuery('');
    setVerseResults([]);
  }, []);

  const reset = () => {
    if (videoFile) URL.revokeObjectURL(videoFile.previewUrl);
    setVideoFile(null);
    setCaption('');
    setVerseQuery('');
    setVerseResults([]);
    setSelectedVerse(null);
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
      form.append('verse_reference', selectedVerse?.reference ?? '');
      form.append('verse_text', selectedVerse?.text ?? '');

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

  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <ToolBtn
        label="Tag scripture"
        active={scriptureOpen || !!selectedVerse}
        onClick={() => setScriptureOpen((v) => !v)}
      >
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
  );

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="Upload Video"
      footer={toolbar}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

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

        {/* Scripture tag picker */}
        {scriptureOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {/* Selected verse chip */}
            {selectedVerse ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-accent-soft)',
                border: '1px solid var(--color-accent)',
                alignSelf: 'flex-start',
                maxWidth: '100%',
              }}>
                <BookOpen size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <span style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 220,
                }}>
                  {selectedVerse.reference}
                </span>
                <button
                  onClick={clearVerse}
                  aria-label="Remove verse tag"
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: 'var(--color-accent)', display: 'flex', alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              /* Search input */
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)', pointerEvents: 'none',
                  }}
                />
                <input
                  value={verseQuery}
                  onChange={(e) => setVerseQuery(e.target.value)}
                  placeholder="Search verse… e.g. John 3:16 or 'love'"
                  maxLength={120}
                  className="field-input"
                  style={{ paddingLeft: 30 }}
                />
              </div>
            )}

            {/* Dropdown results */}
            {!selectedVerse && verseResults.length > 0 && (
              <div style={{
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                overflow: 'hidden',
              }}>
                {verseResults.map((v) => (
                  <button
                    key={v.reference}
                    onClick={() => selectVerse(v)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      width: '100%', padding: 'var(--space-3) var(--space-4)',
                      background: 'none', border: 'none', borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer', textAlign: 'left', gap: 'var(--space-1)',
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
                      {v.reference}
                    </span>
                    <span style={{
                      fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {v.text}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!selectedVerse && verseLoading && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                Searching…
              </p>
            )}

            {!selectedVerse && !verseLoading && verseQuery.trim().length > 1 && verseResults.length === 0 && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                No verses found. Try a reference like &ldquo;Romans 8&rdquo; or a keyword.
              </p>
            )}
          </div>
        )}

        {error && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error)', margin: 0, textAlign: 'center' }}>
            {error}
          </p>
        )}
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
