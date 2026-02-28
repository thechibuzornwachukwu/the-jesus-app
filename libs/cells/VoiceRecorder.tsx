'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';

interface VoiceRecorderProps {
  onAudioReady: (blob: Blob, mimeType: string) => Promise<void>;
}

const MAX_SECONDS = 120;

function getBestMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
  return 'audio/ogg';
}

export function VoiceRecorder({ onAudioReady }: VoiceRecorderProps) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
  }, []);

  const startRecording = async () => {
    if (recording || processing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getBestMimeType();
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        setProcessing(true);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        try {
          await onAudioReady(blob, mimeType);
        } finally {
          setProcessing(false);
        }
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mr.start(100);
      setRecording(true);
      setSecondsLeft(MAX_SECONDS);

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setSupported(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setSecondsLeft(MAX_SECONDS);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!supported) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {recording && (
        <span
          style={{
            position: 'absolute',
            top: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-error)',
            whiteSpace: 'nowrap',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
      )}

      <button
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerLeave={recording ? stopRecording : undefined}
        onPointerCancel={recording ? stopRecording : undefined}
        disabled={processing}
        aria-label={recording ? 'Release to send voice message' : 'Hold to record voice message'}
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: recording
            ? 'var(--color-error)'
            : processing
            ? 'var(--color-border)'
            : 'var(--color-bg-surface)',
          cursor: processing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: recording ? '#fff' : 'var(--color-text-muted)',
          transition: 'background 0.15s, transform 0.1s',
          transform: recording ? 'scale(1.15)' : 'scale(1)',
          animation: recording ? 'voice-pulse 1s ease-in-out infinite' : 'none',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {processing ? (
          <span
            style={{
              width: 16,
              height: 16,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        ) : (
          <Mic size={18} aria-hidden="true" />
        )}
      </button>

      <style>{`
        @keyframes voice-pulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--color-pulse-active); }
          50% { box-shadow: 0 0 0 8px var(--color-pulse-fade); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
