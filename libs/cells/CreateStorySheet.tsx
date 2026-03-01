'use client';

import React, { useRef, useState, useTransition } from 'react';
import { ImagePlus, X, Send } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { Spinner } from '../shared-ui/Spinner';
import { showToast } from '../shared-ui/Toast';
import { createStory } from '../../lib/cells/actions';

interface CreateStorySheetProps {
  open: boolean;
  onClose: () => void;
  cellId: string;
}

export function CreateStorySheet({ open, onClose, cellId }: CreateStorySheetProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handlePublish = async () => {
    if (!mediaFile) return;
    setUploading(true);

    // Upload via the explore upload endpoint (reuse it for stories too)
    const formData = new FormData();
    formData.append('file', mediaFile);
    formData.append('type', 'story');

    try {
      const res = await fetch('/api/explore/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok || !json.url) {
        showToast('Upload failed. Try again.', 'error');
        setUploading(false);
        return;
      }

      startTransition(() => {
        createStory(cellId, json.url, mediaType, caption.trim() || null).then((result) => {
          if ('error' in result) {
            showToast(result.error, 'error');
          } else {
            showToast('Story posted!', 'success');
            handleClose();
          }
        });
      });
    } catch {
      showToast('Upload failed. Try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setMediaFile(null);
    setCaption('');
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="New Story">
      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Media picker */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {preview ? (
          <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '9/16', maxHeight: 320 }}>
            {mediaType === 'video' ? (
              <video
                src={preview}
                controls
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              />
            ) : (
              <img
                src={preview}
                alt="Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
            <button
              onClick={() => { setPreview(null); setMediaFile(null); }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} color="#fff" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              height: 160,
              borderRadius: 'var(--radius-md)',
              border: '2px dashed var(--color-border)',
              background: 'var(--color-surface)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            <ImagePlus size={28} />
            <span style={{ fontSize: 'var(--font-size-sm)' }}>Tap to select photo or video</span>
          </button>
        )}

        {/* Caption */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption…"
          maxLength={200}
          rows={3}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            color: 'var(--color-text)',
            fontSize: 'var(--font-size-sm)',
            resize: 'none',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.5,
            boxSizing: 'border-box',
            width: '100%',
          }}
        />

        {/* Publish */}
        <button
          onClick={handlePublish}
          disabled={!mediaFile || uploading}
          style={{
            height: 48,
            borderRadius: 'var(--radius-full)',
            background: !mediaFile || uploading ? 'var(--color-surface)' : 'var(--color-accent)',
            border: 'none',
            color: !mediaFile || uploading ? 'var(--color-text-faint)' : 'var(--color-accent-text)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            cursor: !mediaFile || uploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}
        >
          {uploading ? <Spinner size={18} /> : <Send size={16} />}
          {uploading ? 'Posting…' : 'Post Story'}
        </button>
      </div>
    </BottomSheet>
  );
}
