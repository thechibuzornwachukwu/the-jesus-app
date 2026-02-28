'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

const BAR_COUNT = 40;

// Static amplitude pattern — pseudo-random via overlapping sine waves
const BAR_AMPLITUDES = Array.from({ length: BAR_COUNT }, (_, i) => {
  const v =
    0.3 +
    0.35 * Math.abs(Math.sin(i * 0.7)) +
    0.2 * Math.abs(Math.sin(i * 0.3 + 1.5)) +
    0.15 * Math.abs(Math.sin(i * 1.2 + 0.8));
  return Math.min(1, v);
});

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface AudioMessageProps {
  audioUrl: string;
  duration?: number;
  /** Message ID passed to the reply callback */
  messageId?: string;
  /** Called when user long-presses a waveform position and taps "Reply at [X:XX]" */
  onTimestampReply?: (messageId: string, seconds: number) => void;
  /** Compact mode used in quoted reply previews */
  compact?: boolean;
}

export function AudioMessage({
  audioUrl,
  duration,
  messageId,
  onTimestampReply,
  compact = false,
}: AudioMessageProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const [totalDuration, setTotalDuration] = useState(duration ?? 0);
  const [tooltip, setTooltip] = useState<{ barIdx: number } | null>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onLoadedMetadata = () => setTotalDuration(audio.duration);
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

  const seekToBar = (barIdx: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const ratio = (barIdx + 0.5) / BAR_COUNT;
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  };

  const getSecondsForBar = useCallback(
    (barIdx: number) => ((barIdx + 0.5) / BAR_COUNT) * totalDuration,
    [totalDuration]
  );

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleBarPointerDown = (barIdx: number) => {
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      setTooltip({ barIdx });
    }, 480);
  };

  const handleBarPointerUp = (barIdx: number) => {
    const wasLongPress = !!longPressTimer.current === false; // timer already fired
    clearLongPress();
    if (!tooltip) {
      // Short tap → seek
      seekToBar(barIdx);
    }
  };

  const handleReplyFromTooltip = () => {
    if (!messageId || !onTimestampReply || !tooltip) return;
    onTimestampReply(messageId, getSecondsForBar(tooltip.barIdx));
    setTooltip(null);
  };

  const activeBarCount = Math.round(progress * BAR_COUNT);
  const maxBarH = compact ? 20 : 28;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        minWidth: compact ? 120 : 160,
        position: 'relative',
      }}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        aria-label={playing ? 'Pause' : 'Play'}
        style={{
          width: compact ? 24 : 32,
          height: compact ? 24 : 32,
          borderRadius: 'var(--radius-full)',
          border: '1.5px solid currentColor',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'inherit',
          flexShrink: 0,
        }}
      >
        {playing ? <Pause size={compact ? 8 : 12} /> : <Play size={compact ? 8 : 12} />}
      </button>

      {/* Waveform bars */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          height: compact ? 24 : 36,
          position: 'relative',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {BAR_AMPLITUDES.map((amp, idx) => {
          const isActive = idx < activeBarCount;
          const barH = Math.max(4, amp * maxBarH);
          const isTooltipBar = tooltip?.barIdx === idx;

          return (
            <div
              key={idx}
              onPointerDown={(e) => {
                e.preventDefault();
                handleBarPointerDown(idx);
              }}
              onPointerUp={() => handleBarPointerUp(idx)}
              onPointerLeave={clearLongPress}
              style={{
                flex: 1,
                height: barH,
                borderRadius: 2,
                background: isActive ? 'currentColor' : 'var(--color-border)',
                cursor: 'pointer',
                transition: 'background 0.1s',
                opacity: isTooltipBar ? 1 : isActive ? 0.9 : 0.55,
              }}
            />
          );
        })}

        {/* Long-press tooltip */}
        {tooltip && (
          <>
            <div
              onClick={() => setTooltip(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 98 }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: `clamp(40px, ${((tooltip.barIdx + 0.5) / BAR_COUNT) * 100}%, calc(100% - 60px))`,
                transform: 'translateX(-50%)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
                zIndex: 99,
                padding: '6px 10px',
                whiteSpace: 'nowrap',
              }}
            >
              {messageId && onTimestampReply ? (
                <button
                  onClick={handleReplyFromTooltip}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-accent)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 'var(--font-weight-semibold)',
                    padding: 0,
                  }}
                >
                  Reply at {formatDuration(getSecondsForBar(tooltip.barIdx))}
                </button>
              ) : (
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {formatDuration(getSecondsForBar(tooltip.barIdx))}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Duration label */}
      {!compact && (
        <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.8, flexShrink: 0 }}>
          {totalDuration > 0 ? formatDuration(totalDuration) : '–:––'}
        </span>
      )}
    </div>
  );
}
