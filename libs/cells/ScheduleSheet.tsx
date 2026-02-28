'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';

interface ScheduleSheetProps {
  open: boolean;
  onClose: () => void;
  content: string;
  onSchedule: (sendAt: string) => void;
  loading?: boolean;
}

/** Returns an ISO-like string suitable for datetime-local input, in local time */
function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  );
}

/** Returns a min datetime value (5 minutes from now) */
function getMinDatetime(): string {
  return toLocalDatetimeValue(new Date(Date.now() + 5 * 60 * 1000));
}

/** Formats a local datetime string for display */
function formatDatetime(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ScheduleSheet({
  open,
  onClose,
  content,
  onSchedule,
  loading = false,
}: ScheduleSheetProps) {
  const [sendAt, setSendAt] = useState('');

  useEffect(() => {
    if (open) {
      // Default to 1 hour from now
      setSendAt(toLocalDatetimeValue(new Date(Date.now() + 60 * 60 * 1000)));
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!sendAt) return;
    // Convert local datetime-local value to UTC ISO string
    const utcIso = new Date(sendAt).toISOString();
    onSchedule(utcIso);
  };

  const minValue = getMinDatetime();
  const isValid = sendAt >= minValue;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4,5,3,0.7)',
          zIndex: 200,
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          padding: 'var(--space-4)',
          zIndex: 201,
          boxShadow: '0 -4px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: 'var(--color-border)',
            margin: '0 auto var(--space-4)',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Clock size={18} color="var(--color-accent)" />
            <span
              style={{
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text)',
              }}
            >
              Schedule Message
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--space-1)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Message preview */}
        <div
          style={{
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              marginBottom: 4,
            }}
          >
            Message preview
          </p>
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text)',
              lineHeight: 'var(--line-height-normal)',
              margin: 0,
              wordBreak: 'break-word',
              maxHeight: 80,
              overflowY: 'auto',
            }}
          >
            {content || <em style={{ color: 'var(--color-text-faint)' }}>Voice message</em>}
          </p>
        </div>

        {/* Date + time picker */}
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Send at
        </label>
        <input
          type="datetime-local"
          value={sendAt}
          min={minValue}
          onChange={(e) => setSendAt(e.target.value)}
          style={{
            width: '100%',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${isValid ? 'var(--color-border-focus)' : 'var(--color-error)'}`,
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            boxSizing: 'border-box',
            colorScheme: 'dark',
          }}
        />

        {sendAt && isValid && (
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              marginTop: 'var(--space-1)',
            }}
          >
            Will send {formatDatetime(sendAt)}
          </p>
        )}

        {sendAt && !isValid && (
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-error)',
              marginTop: 'var(--space-1)',
            }}
          >
            Must be at least 5 minutes in the future
          </p>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!isValid || loading}
          style={{
            width: '100%',
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: isValid && !loading ? 'var(--color-accent)' : 'var(--color-border)',
            color: isValid && !loading ? 'var(--color-accent-text)' : 'var(--color-text-faint)',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-base)',
            cursor: isValid && !loading ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {loading ? 'Scheduling…' : 'Schedule Message'}
        </button>
      </div>
    </>
  );
}
