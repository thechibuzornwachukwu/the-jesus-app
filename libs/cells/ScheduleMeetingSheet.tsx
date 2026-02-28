'use client';

import React, { useState, useTransition } from 'react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { Button } from '../shared-ui/Button';
import { Input } from '../shared-ui/Input';
import { createMeeting, updateMeeting } from '../../lib/cells/meeting-actions';
import type { ScheduledMeeting } from '../../lib/cells/meeting-actions';

interface ScheduleMeetingSheetProps {
  open: boolean;
  onClose: () => void;
  channelId: string;
  cellId: string;
  /** Pass to pre-populate fields when editing an existing meeting */
  editMeeting?: ScheduledMeeting | null;
  onSaved?: (meetingId: string) => void;
}

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];

/** Convert a local datetime-local string to ISO UTC */
function localToISO(local: string): string {
  return new Date(local).toISOString();
}

/** Convert an ISO UTC string to a datetime-local value */
function isoToLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Default datetime-local value: now + 1 hour, rounded to nearest 30 min */
function defaultDateTime(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() >= 30 ? 30 : 0, 0, 0);
  return isoToLocal(d.toISOString());
}

export function ScheduleMeetingSheet({
  open,
  onClose,
  channelId,
  cellId,
  editMeeting,
  onSaved,
}: ScheduleMeetingSheetProps) {
  const isEdit = Boolean(editMeeting);

  const [title, setTitle] = useState(editMeeting?.title ?? '');
  const [dateTime, setDateTime] = useState(
    editMeeting ? isoToLocal(editMeeting.scheduled_at) : defaultDateTime()
  );
  const [durationMin, setDurationMin] = useState(editMeeting?.duration_min ?? 60);
  const [description, setDescription] = useState(editMeeting?.description ?? '');
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  // Reset fields when editMeeting changes
  React.useEffect(() => {
    if (!open) return;
    setTitle(editMeeting?.title ?? '');
    setDateTime(editMeeting ? isoToLocal(editMeeting.scheduled_at) : defaultDateTime());
    setDurationMin(editMeeting?.duration_min ?? 60);
    setDescription(editMeeting?.description ?? '');
    setError('');
  }, [open, editMeeting]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (!dateTime) { setError('Date and time are required'); return; }

    setError('');
    startTransition(async () => {
      if (isEdit && editMeeting) {
        const result = await updateMeeting(editMeeting.id, {
          cellId,
          title: title.trim(),
          scheduledAt: localToISO(dateTime),
          durationMin,
          description: description.trim() || undefined,
        });
        if ('error' in result) { setError(result.error); return; }
        onSaved?.(editMeeting.id);
      } else {
        const result = await createMeeting(channelId, {
          cellId,
          title: title.trim(),
          scheduledAt: localToISO(dateTime),
          durationMin,
          description: description.trim() || undefined,
        });
        if ('error' in result) { setError(result.error); return; }
        onSaved?.(result.id);
      }
      onClose();
    });
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={isEdit ? 'Edit Meeting' : 'Schedule Meeting'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

        {/* Title */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-1)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Weekly Prayer Call"
            maxLength={80}
          />
        </div>

        {/* Date + time */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-1)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Date & Time
          </label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            style={{
              width: '100%',
              padding: '10px var(--space-3)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-sans)',
              boxSizing: 'border-box',
              colorScheme: 'dark',
            }}
          />
        </div>

        {/* Duration */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-1)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Duration
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDurationMin(opt.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  border: durationMin === opt.value
                    ? '1px solid var(--color-accent)'
                    : '1px solid var(--color-border)',
                  background: durationMin === opt.value ? 'var(--color-accent-soft)' : 'transparent',
                  color: durationMin === opt.value ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.1s, border-color 0.1s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-1)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda, notes, or Zoom link…"
            rows={3}
            maxLength={400}
            style={{
              width: '100%',
              padding: '10px var(--space-3)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-sans)',
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
          />
        </div>

        {error && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-error)', margin: 0 }}>{error}</p>
        )}

        <Button type="submit" style={{ width: '100%' }}>
          {isEdit ? 'Save Changes' : 'Schedule Meeting'}
        </Button>
      </form>
    </BottomSheet>
  );
}
