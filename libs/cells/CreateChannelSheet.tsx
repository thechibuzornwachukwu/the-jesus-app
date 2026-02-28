'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { BottomSheet } from '../shared-ui/BottomSheet';
import type { ChannelCategory, ChannelType } from '../../lib/cells/types';

const EmojiPicker = dynamic(() => import('@emoji-mart/react').then((m) => ({ default: m.default })), {
  ssr: false,
  loading: () => null,
});

const COLOR_PRESETS = ['#d4922a', '#4ade80', '#60a5fa', '#f87171', '#a78bfa', '#facc15'];

interface CreateChannelSheetProps {
  open: boolean;
  onClose: () => void;
  categories: ChannelCategory[];
  defaultCategoryId?: string;
  onSubmit: (data: {
    name: string;
    emoji: string;
    color: string;
    channelType: ChannelType;
    categoryId: string;
  }) => Promise<void>;
}

export function CreateChannelSheet({
  open,
  onClose,
  categories,
  defaultCategoryId,
  onSubmit,
}: CreateChannelSheetProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💬');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [channelType, setChannelType] = useState<ChannelType>('text');
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? categories[0]?.id ?? '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !categoryId) return;
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), emoji, color, channelType, categoryId });
      setName('');
      setEmoji('💬');
      setColor(COLOR_PRESETS[0]);
      setChannelType('text');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [name, emoji, color, channelType, categoryId, onSubmit, onClose]);

  return (
    <BottomSheet open={open} onClose={onClose} title="New Channel">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Emoji + name row */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowEmojiPicker((v) => !v)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-dp1)',
                fontSize: 22,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {emoji}
            </button>
            {showEmojiPicker && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '110%',
                  left: 0,
                  zIndex: 50,
                }}
              >
                <EmojiPicker
                  theme="dark"
                  onEmojiSelect={(e: { native: string }) => {
                    setEmoji(e.native);
                    setShowEmojiPicker(false);
                  }}
                  previewPosition="none"
                />
              </div>
            )}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="channel-name"
            maxLength={40}
            style={{
              flex: 1,
              height: 44,
              background: 'var(--color-surface-dp1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-base)',
              padding: '0 var(--space-3)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
        </div>

        {/* Color swatches */}
        <div>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-2)',
              fontWeight: 'var(--font-weight-semibold)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Color
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-full)',
                  background: c,
                  border: color === c ? '2px solid var(--color-text)' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Category selector */}
        {categories.length > 1 && (
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-2)',
                fontWeight: 'var(--font-weight-semibold)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Category
            </p>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                background: 'var(--color-surface-dp1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
                fontSize: 'var(--font-size-sm)',
                padding: '0 var(--space-3)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Channel type toggle */}
        <div>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-2)',
              fontWeight: 'var(--font-weight-semibold)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Type
          </p>
          <div
            style={{
              display: 'flex',
              background: 'var(--color-surface-dp1)',
              borderRadius: 'var(--radius-md)',
              padding: 3,
              gap: 3,
            }}
          >
            {(['text', 'announcement'] as ChannelType[]).map((t) => (
              <button
                key={t}
                onClick={() => setChannelType(t)}
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: channelType === t ? 'var(--color-accent)' : 'transparent',
                  color: channelType === t ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          style={{
            height: 44,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: name.trim() && !loading ? 'var(--color-accent)' : 'var(--color-surface-dp1)',
            color: name.trim() && !loading ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: name.trim() && !loading ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-sans)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {loading ? 'Creating…' : 'Create Channel'}
        </button>
      </div>
    </BottomSheet>
  );
}
