'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { showToast } from '../../../../libs/shared-ui/Toast';
import { createClient } from '../../../../lib/supabase/client';
import { submitTestimony } from '../../../../lib/testify/actions';
import type { TestimonyCategory } from '../../../../lib/testify/types';

const CATEGORIES: TestimonyCategory[] = [
  'Salvation',
  'Healing',
  'Provision',
  'Breakthrough',
  'Restoration',
  'Deliverance',
  'Marriage',
  'Protection',
];

const MIN_STORY_CHARS = 100;

export function SubmitTestimonyClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TestimonyCategory | ''>('');
  const [story, setStory] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [showStreak, setShowStreak] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Title is required.';
    if (!category) next.category = 'Please choose a category.';
    if (story.trim().length < MIN_STORY_CHARS)
      next.story = `Your story must be at least ${MIN_STORY_CHARS} characters (${story.trim().length}/${MIN_STORY_CHARS}).`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      let media_url: string | undefined;

      // Upload media file to testimony-media bucket if provided
      if (mediaFile) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const ext = mediaFile.name.split('.').pop()?.toLowerCase() ?? 'bin';
          const path = `${user.id}/${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('testimony-media')
            .upload(path, mediaFile, { contentType: mediaFile.type, upsert: false });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('testimony-media')
              .getPublicUrl(path);
            media_url = publicUrl;
          }
        }
      }

      const { id, error } = await submitTestimony({
        title: title.trim(),
        category,
        full_story: story.trim(),
        show_streak: showStreak,
        media_url,
      });

      if (error) {
        showToast(error, 'error');
        return;
      }

      showToast('Your testimony has been shared! 🙌', 'success');
      router.push(id ? `/testify/${id}` : '/testify');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setMediaFile(file);
  };

  const clearFile = () => {
    setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--color-surface-high)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--color-text)',
    fontSize: 'var(--font-size-base)',
    padding: '12px 14px',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    marginBottom: 6,
    letterSpacing: '0.02em',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-error)',
    marginTop: 4,
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        overflowY: 'auto',
        paddingBottom: 'calc(var(--safe-bottom, 0px) + 80px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 'calc(var(--safe-top, 0px) + 12px) 20px 12px',
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={22} />
        </button>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 900,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Share Your Testimony
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 20px' }}>

          {/* Title */}
          <div>
            <label style={labelStyle} htmlFor="testimony-title">Title</label>
            <input
              id="testimony-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your testimony a title…"
              maxLength={120}
              style={{
                ...fieldStyle,
                borderColor: errors.title ? 'var(--color-error)' : 'var(--color-border)',
              }}
            />
            {errors.title && <p style={errorStyle}>{errors.title}</p>}
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle} htmlFor="testimony-category">Category</label>
            <select
              id="testimony-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TestimonyCategory)}
              style={{
                ...fieldStyle,
                appearance: 'none',
                borderColor: errors.category ? 'var(--color-error)' : 'var(--color-border)',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>Select a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p style={errorStyle}>{errors.category}</p>}
          </div>

          {/* Full story */}
          <div>
            <label style={labelStyle} htmlFor="testimony-story">
              Your Story
              <span
                style={{
                  marginLeft: 6,
                  fontWeight: 400,
                  color:
                    story.trim().length >= MIN_STORY_CHARS
                      ? 'var(--color-success)'
                      : 'var(--color-text-faint)',
                }}
              >
                ({story.trim().length} chars)
              </span>
            </label>
            <textarea
              id="testimony-story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Tell us what God did. Be as detailed as you like — your testimony could be someone else's miracle."
              rows={8}
              style={{
                ...fieldStyle,
                resize: 'vertical',
                lineHeight: 1.65,
                borderColor: errors.story ? 'var(--color-error)' : 'var(--color-border)',
              }}
            />
            {errors.story && <p style={errorStyle}>{errors.story}</p>}
          </div>

          {/* Media upload */}
          <div>
            <label style={labelStyle}>Photo or Video (optional)</label>
            {mediaFile ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface-high)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Upload size={16} color="var(--color-accent)" />
                <span
                  style={{
                    flex: 1,
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mediaFile.name}
                </span>
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Remove file"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: 2,
                    display: 'flex',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px dashed var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'border-color 0.15s',
                }}
              >
                <Upload size={16} />
                Add a photo or video
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-hidden
            />
          </div>

          {/* Show streak toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  margin: 0,
                  marginBottom: 2,
                }}
              >
                Show my streak on this testimony
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Displays &ldquo;Seeking God for X days&rdquo; on your card
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showStreak}
              onClick={() => setShowStreak((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: showStreak ? 'var(--color-accent)' : 'var(--color-text-faint)',
                display: 'flex',
                flexShrink: 0,
                transition: 'color 0.15s',
              }}
            >
              {showStreak ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 'var(--radius-lg)',
              background: submitting ? 'var(--color-border)' : 'var(--color-accent)',
              border: 'none',
              color: submitting ? 'var(--color-text-muted)' : 'var(--color-accent-text)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              cursor: submitting ? 'default' : 'pointer',
              letterSpacing: '0.02em',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Sharing…' : 'Share My Testimony'}
          </button>
        </div>
      </form>
    </div>
  );
}
