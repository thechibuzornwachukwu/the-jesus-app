'use client';

import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FullScreenModal } from '../shared-ui/FullScreenModal';
import { Button } from '../shared-ui/Button';
import { Input } from '../shared-ui/Input';
import { Avatar } from '../shared-ui/Avatar';
import { ChipGroup } from '../shared-ui';
import { createClient } from '../../lib/supabase/client';
import { createCell } from '../../lib/cells/actions';

const CATEGORIES = ['Prayer', 'Bible Study', 'Youth', 'Worship', 'Discipleship', 'General'] as const;
type Category = (typeof CATEGORIES)[number];

interface CreateCellSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CreateCellSheet({ open, onClose }: CreateCellSheetProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('General');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName('');
    setDescription('');
    setCategory('General');
    setAvatarUrl(null);
    setIsPublic(true);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('cell-avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('cell-avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch {
      setError('Avatar upload failed. You can still create the cell without one.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Cell name must be at least 2 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set('name', name.trim());
    formData.set('description', description);
    formData.set('category', category);
    formData.set('avatar_url', avatarUrl ?? '');
    formData.set('is_public', isPublic ? 'true' : 'false');

    const result = await createCell(formData);

    if ('error' in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    reset();
    onClose();
    router.push(`/engage/${result.slug}/info`);
  };

  const footerContent = (
    <div
      style={{
        padding: 'var(--space-4) var(--space-6) calc(var(--safe-bottom, 0px) + var(--space-4))',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <Button
        type="submit"
        form="create-cell-form"
        loading={submitting}
        disabled={submitting || uploading || name.trim().length < 2}
        className="w-full"
      >
        Create Cell
      </Button>
    </div>
  );

  return (
    <FullScreenModal open={open} onClose={handleClose} title="Create a Cell" footerContent={footerContent}>
      <form
        id="create-cell-form"
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          padding: 'var(--space-5) var(--space-6)',
        }}
      >
        {/* Avatar upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Upload cell photo"
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              border: '2px dashed var(--color-border)',
              background: 'var(--color-bg-surface)',
              cursor: uploading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              padding: 0,
            }}
          >
            {avatarUrl ? (
              <Avatar src={avatarUrl} size={64} />
            ) : uploading ? (
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>…</span>
            ) : (
              <Camera size={24} color="var(--color-text-muted)" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {uploading ? 'Uploading…' : 'Tap to add a cell photo'}
          </span>
        </div>

        {/* Name */}
        <Input
          label="Cell Name"
          id="cell-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sunday Seekers"
          required
          minLength={2}
          maxLength={50}
        />

        {/* Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label
            htmlFor="cell-desc"
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}
          >
            Description{' '}
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-regular)' }}>
              (optional)
            </span>
          </label>
          <textarea
            id="cell-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this cell about?"
            maxLength={200}
            rows={3}
            className="field-textarea"
            style={{ fontSize: 'var(--font-size-base)', padding: 'var(--space-3) var(--space-4)' }}
          />
          <span
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-xs)',
              textAlign: 'right',
            }}
          >
            {description.length}/200
          </span>
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)' as React.CSSProperties['fontWeight'],
              color: 'var(--color-text-primary)',
            }}
          >
            Category
          </span>
          <ChipGroup
            options={[...CATEGORIES]}
            value={category}
            onChange={(v) => setCategory(v as Category)}
            mode="single"
          />
        </div>

        {/* Public / Private toggle */}
        <button
          type="button"
          onClick={() => setIsPublic((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <div>
            <p style={{ margin: 0, color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
              {isPublic ? 'Public Cell' : 'Private Cell'}
            </p>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
              {isPublic ? 'Anyone can find and join this cell' : 'Only people with an invite link can join'}
            </p>
          </div>
          {/* pill toggle */}
          <div
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: isPublic ? 'var(--color-accent)' : 'var(--color-border)',
              position: 'relative',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: isPublic ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'var(--color-text)',
                transition: 'left 0.2s',
              }}
            />
          </div>
        </button>

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
        )}
      </form>
    </FullScreenModal>
  );
}
