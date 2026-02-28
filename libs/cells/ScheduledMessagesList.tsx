'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, Trash2, Edit3, Check } from 'lucide-react';
import {
  getScheduledMessages,
  cancelScheduledMessage,
  updateScheduledMessage,
} from '../../lib/cells/actions';

interface ScheduledMessage {
  id: string;
  content: string | null;
  message_type: string;
  send_at: string;
  created_at: string;
}

interface ScheduledMessagesListProps {
  open: boolean;
  onClose: () => void;
  cellId: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toLocalDatetimeValue(iso: string): string {
  const date = new Date(iso);
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

function formatSendAt(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ScheduledMessagesList({ open, onClose, cellId }: ScheduledMessagesListProps) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getScheduledMessages(cellId);
    setMessages(data);
    setLoading(false);
  }, [cellId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!open) return null;

  const handleCancel = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await cancelScheduledMessage(id);
  };

  const startEdit = (msg: ScheduledMessage) => {
    setEditingId(msg.id);
    setEditValue(toLocalDatetimeValue(msg.send_at));
  };

  const saveEdit = async () => {
    if (!editingId || !editValue) return;
    setSaving(true);
    const utcIso = new Date(editValue).toISOString();
    const result = await updateScheduledMessage(editingId, utcIso);
    if (!('error' in result)) {
      setMessages((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, send_at: utcIso } : m))
      );
    }
    setEditingId(null);
    setSaving(false);
  };

  const minValue = (() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes())
    );
  })();

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
          maxHeight: '70dvh',
          display: 'flex',
          flexDirection: 'column',
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
            flexShrink: 0,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-3)',
            flexShrink: 0,
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
              Scheduled Messages
            </span>
            {messages.length > 0 && (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-faint)',
                  background: 'var(--color-bg)',
                  borderRadius: 99,
                  padding: '1px 8px',
                }}
              >
                {messages.length}
              </span>
            )}
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

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
                padding: 'var(--space-6) 0',
              }}
            >
              Loading…
            </p>
          )}

          {!loading && messages.length === 0 && (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
                padding: 'var(--space-8) 0',
              }}
            >
              No scheduled messages
            </p>
          )}

          {!loading &&
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  marginBottom: 'var(--space-2)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {/* Message preview */}
                <p
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    margin: '0 0 var(--space-2)',
                    lineHeight: 'var(--line-height-normal)',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.message_type === 'audio'
                    ? '🎤 Voice message'
                    : (msg.content ?? '')}
                </p>

                {/* Edit or display send time */}
                {editingId === msg.id ? (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <input
                      type="datetime-local"
                      value={editValue}
                      min={minValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border-focus)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-sans)',
                        outline: 'none',
                        colorScheme: 'dark',
                      }}
                    />
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      aria-label="Save"
                      style={{
                        background: 'var(--color-accent)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--color-accent-text)',
                      }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel edit"
                      style={{
                        background: 'none',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Clock size={11} />
                      {formatSendAt(msg.send_at)}
                    </span>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button
                        onClick={() => startEdit(msg)}
                        aria-label="Reschedule"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-text-muted)',
                          padding: '4px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleCancel(msg.id)}
                        aria-label="Cancel message"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-error)',
                          padding: '4px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
