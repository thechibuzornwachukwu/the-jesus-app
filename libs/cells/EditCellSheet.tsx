'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, ToggleLeft, ToggleRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { Button } from '../shared-ui/Button';
import { Input } from '../shared-ui/Input';
import { Avatar } from '../shared-ui/Avatar';
import { ChipGroup } from '../shared-ui';
import { createClient } from '../../lib/supabase/client';
import { updateCell } from '../../lib/cells/actions';
import type { Cell } from '../../lib/cells/types';

const CATEGORIES = ['Prayer', 'Bible Study', 'Youth', 'Worship', 'Discipleship', 'General'] as const;
type Category = (typeof CATEGORIES)[number];

interface EditCellSheetProps {
  open: boolean;
  onClose: () => void;
  cell: Cell;
}

export function EditCellSheet({ open, onClose, cell }: EditCellSheetProps) {
  const router = useRouter();
  const [name, setName] = useState(cell.name);
  const [description, setDescription] = useState(cell.description ?? '');
  const [category, setCategory] = useState<Category>((cell.category as Category) ?? 'General');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(cell.avatar_url);
  const [isPublic, setIsPublic] = useState(cell.is_public);
  const [rules, setRules] = useState(cell.rules ?? '');
  const [memberLimit, setMemberLimit] = useState<string>(
    cell.member_limit != null ? String(cell.member_limit) : ''
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset fields to latest cell values each time the sheet opens
  useEffect(() => {
    if (open) {
      setName(cell.name);
      setDescription(cell.description ?? '');
      setCategory((cell.category as Category) ?? 'General');
      setAvatarUrl(cell.avatar_url);
      setIsPublic(cell.is_public);
      setRules(cell.rules ?? '');
      setMemberLimit(cell.member_limit != null ? String(cell.member_limit) : '');
      setError(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setError(null);
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
      setError('Avatar upload failed.');
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
    formData.set('rules', rules);
    if (memberLimit.trim()) formData.set('member_limit', memberLimit.trim());

    const result = await updateCell(cell.id, formData);

    if ('error' in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    onClose();
    router.refresh();
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="Edit Cell">
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      >
        {/* Avatar upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change cell photo"
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
            {uploading ? 'Uploading…' : 'Tap to change cell photo'}
          </span>
        </div>

        {/* Name */}
        <Input
          label="Cell Name"
          id="edit-cell-name"
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
            htmlFor="edit-cell-desc"
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
            id="edit-cell-desc"
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

        {/* is_public toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              Public Cell
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                margin: '2px 0 0',
              }}
            >
              {isPublic ? 'Anyone can join' : 'Invite-only'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            aria-pressed={isPublic}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: isPublic ? 'var(--color-accent)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {isPublic ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>

        {/* Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label
            htmlFor="edit-cell-rules"
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}
          >
            Cell Rules{' '}
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-regular)' }}>
              (optional)
            </span>
          </label>
          <textarea
            id="edit-cell-rules"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Community guidelines members should follow…"
            maxLength={500}
            rows={4}
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
            {rules.length}/500
          </span>
        </div>

        {/* Member Limit */}
        <Input
          label="Member Limit"
          id="edit-cell-limit"
          type="number"
          value={memberLimit}
          onChange={(e) => setMemberLimit(e.target.value)}
          placeholder="No limit"
          min={2}
          max={10000}
        />

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
        )}

        <Button
          type="submit"
          loading={submitting}
          disabled={submitting || uploading || name.trim().length < 2}
          className="w-full"
        >
          Save Changes
        </Button>
      </form>
    </BottomSheet>
  );
}
