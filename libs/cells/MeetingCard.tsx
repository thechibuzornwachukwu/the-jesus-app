'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Calendar, Clock, Users, MoreVertical, X, Check, Minus } from 'lucide-react';
import type { ScheduledMeeting, MeetingRsvp } from '../../lib/cells/meeting-actions';
import { upsertRsvp, cancelMeeting } from '../../lib/cells/meeting-actions';

interface MeetingCardProps {
  meeting: ScheduledMeeting;
  rsvps: MeetingRsvp[];
  currentUserId: string;
  userRole: 'admin' | 'member';
  cellId: string;
  onEdit?: (meeting: ScheduledMeeting) => void;
  onCancelled?: (meetingId: string) => void;
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function formatCountdown(iso: string): string | null {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Starting now';
  if (diff > 24 * 60 * 60 * 1000) return null; // Only show within 24h
  const h = Math.floor(diff / (60 * 60 * 1000));
  const m = Math.floor((diff % (60 * 60 * 1000)) / 60000);
  if (h > 0) return `Starts in ${h}h ${m}m`;
  return `Starts in ${m}m`;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function MeetingCard({
  meeting,
  rsvps,
  currentUserId,
  userRole,
  cellId,
  onEdit,
  onCancelled,
}: MeetingCardProps) {
  const [localRsvps, setLocalRsvps] = useState<MeetingRsvp[]>(rsvps);
  const [, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(() => formatCountdown(meeting.scheduled_at));

  const myRsvp = localRsvps.find((r) => r.user_id === currentUserId)?.response ?? null;
  const yesCount = localRsvps.filter((r) => r.response === 'yes').length;
  const maybeCount = localRsvps.filter((r) => r.response === 'maybe').length;
  const noCount = localRsvps.filter((r) => r.response === 'no').length;

  const { date, time } = formatDateTime(meeting.scheduled_at);
  const isWithin24h = countdown !== null;

  // Live countdown ticker
  useEffect(() => {
    if (!isWithin24h) return;
    const id = setInterval(() => {
      setCountdown(formatCountdown(meeting.scheduled_at));
    }, 30_000);
    return () => clearInterval(id);
  }, [meeting.scheduled_at, isWithin24h]);

  function handleRsvp(response: 'yes' | 'no' | 'maybe') {
    const prev = localRsvps;
    // Optimistic update
    setLocalRsvps((rs) => {
      const existing = rs.find((r) => r.user_id === currentUserId);
      if (existing) return rs.map((r) => r.user_id === currentUserId ? { ...r, response } : r);
      return [...rs, { meeting_id: meeting.id, user_id: currentUserId, response, updated_at: new Date().toISOString() }];
    });
    startTransition(async () => {
      const result = await upsertRsvp(meeting.id, response);
      if ('error' in result) setLocalRsvps(prev);
    });
  }

  function handleCancel() {
    setMenuOpen(false);
    startTransition(async () => {
      await cancelMeeting(meeting.id, cellId);
      onCancelled?.(meeting.id);
    });
  }

  return (
    <div
      style={{
        background: 'var(--color-surface-dp2)',
        borderLeft: '2px solid var(--color-accent)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3)',
        marginBottom: 'var(--space-3)',
        position: 'relative',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <Calendar size={15} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {meeting.title}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginTop: 2,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Clock size={11} />
              {date} · {time}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {formatDuration(meeting.duration_min)}
            </span>
          </div>
        </div>

        {/* Admin menu */}
        {userRole === 'admin' && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-faint)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 4,
              }}
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setMenuOpen(false)} />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: 'var(--color-surface-dp2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 50,
                    minWidth: 140,
                    overflow: 'hidden',
                  }}
                >
                  {onEdit && (
                    <button
                      onClick={() => { setMenuOpen(false); onEdit(meeting); }}
                      style={{
                        width: '100%',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text)',
                        fontSize: 'var(--font-size-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Edit Meeting
                    </button>
                  )}
                  <button
                    onClick={handleCancel}
                    style={{
                      width: '100%',
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-error)',
                      fontSize: 'var(--font-size-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Cancel Meeting
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {meeting.description && (
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            margin: '0 0 var(--space-2)',
            lineHeight: 1.5,
          }}
        >
          {meeting.description}
        </p>
      )}

      {/* Countdown badge */}
      {countdown && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--color-accent-soft)',
            color: 'var(--color-accent)',
            fontSize: '0.6875rem',
            fontWeight: 'var(--font-weight-semibold)',
            borderRadius: 'var(--radius-full)',
            padding: '2px 8px',
            marginBottom: 'var(--space-2)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              animation: 'meeting-pulse 1.4s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          {countdown}
        </div>
      )}

      {/* RSVP section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {(['yes', 'maybe', 'no'] as const).map((opt) => {
          const count = opt === 'yes' ? yesCount : opt === 'maybe' ? maybeCount : noCount;
          const rsvpIcon = opt === 'yes' ? <Check size={11} /> : opt === 'no' ? <X size={11} /> : <Minus size={11} />;
          const rsvpLabel = opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : 'Maybe';
          const isActive = myRsvp === opt;
          return (
            <button
              key={opt}
              onClick={() => handleRsvp(opt)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                cursor: 'pointer',
                border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                transition: 'background 0.1s, border-color 0.1s',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {rsvpIcon}{rsvpLabel}{count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}

        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.75rem',
            color: 'var(--color-text-faint)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Users size={11} />
          {yesCount + maybeCount}
        </span>
      </div>

      <style>{`
        @keyframes meeting-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
}
