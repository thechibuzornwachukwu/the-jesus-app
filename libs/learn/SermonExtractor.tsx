'use client';

import React, { useState, useRef } from 'react';
import { Upload, Copy } from 'lucide-react';
import type { SermonNotes } from './types';
import { TabBar } from '../shared-ui';

type InputMode = 'text' | 'audio';


function notesToText(notes: SermonNotes): string {
  return [
    `Summary\n${notes.summary}`,
    `\nKey Points\n${notes.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
    `\nScriptures\n${notes.scriptures.join(' • ')}`,
    `\nThemes\n${notes.themes.join(' • ')}`,
    `\nAction Items\n${notes.actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
  ].join('\n');
}

interface SectionCardProps {
  title: string;
  items?: string[];
  body?: string;
  accent?: boolean;
  bodyStyle?: React.CSSProperties;
}

function SectionCard({ title, items, body, accent, bodyStyle }: SectionCardProps) {
  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        borderLeft: accent ? '3px solid var(--color-accent)' : undefined,
      }}
    >
      <p
        style={{
          margin: '0 0 var(--space-2)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {title}
      </p>
      {body && (
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', lineHeight: 'var(--line-height-relaxed)', ...bodyStyle }}>
          {body}
        </p>
      )}
      {items && (
        <ul style={{ margin: 0, paddingLeft: 'var(--space-5)' }}>
          {items.map((item, i) => (
            <li key={i} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', lineHeight: 'var(--line-height-relaxed)', marginBottom: 'var(--space-1)' }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SermonExtractor() {
  const [mode, setMode] = useState<InputMode>('text');
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<SermonNotes | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExtract() {
    setError('');
    setLoading(true);
    setNotes(null);

    try {
      let res: Response;

      if (mode === 'audio' && audioFile) {
        const form = new FormData();
        form.append('audio', audioFile);
        res = await fetch('/api/learn/sermon', { method: 'POST', body: form });
      } else {
        if (!transcript.trim()) {
          setError('Please paste sermon text first.');
          setLoading(false);
          return;
        }
        res = await fetch('/api/learn/sermon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        });
      }

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(msg);
      }

      const data = await res.json();
      setNotes(data.notes as SermonNotes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!notes) return;
    await navigator.clipboard.writeText(notesToText(notes));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <TabBar
        tabs={[{ id: 'text', label: 'Paste Text' }, { id: 'audio', label: 'Upload Audio' }]}
        activeId={mode}
        onChange={(id) => setMode(id as InputMode)}
        variant="pill"
      />

      {/* Input area */}
      {mode === 'text' ? (
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste sermon transcript or notes here…"
          rows={8}
          style={{
            width: '100%',
            background: 'var(--color-bg-surface)',
            border: '1.5px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
            lineHeight: 'var(--line-height-relaxed)',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `1.5px dashed ${audioFile ? 'var(--color-accent)' : 'var(--color-accent-soft)'}`,
            background: 'var(--color-accent-wash)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-10)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
            cursor: 'pointer',
            color: audioFile ? 'var(--color-accent)' : 'var(--color-text-muted)',
            textAlign: 'center',
            transition: 'border-color 0.15s',
          }}
        >
          <Upload size={20} />
          <span style={{ fontSize: 'var(--font-size-sm)' }}>
            {audioFile ? audioFile.name : 'Tap to select audio file (MP3, WAV, MP4 — max 25 MB)'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/mp4"
            style={{ display: 'none' }}
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-error)' }}>
          {error}
        </p>
      )}

      {/* Extract button */}
      <button
        onClick={handleExtract}
        disabled={loading || (mode === 'audio' && !audioFile)}
        style={{
          background: 'var(--color-accent)',
          color: 'var(--color-text-inverse)',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          padding: 'var(--space-3) var(--space-6)',
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-semibold)',
          cursor: 'pointer',
          opacity: loading || (mode === 'audio' && !audioFile) ? 0.55 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: 16,
                height: 16,
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            Extracting…
          </>
        ) : (
          'Extract Sermon Notes'
        )}
      </button>

      {/* Results */}
      {notes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Notes extracted
            </p>
            <button
              onClick={handleCopy}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-1) var(--space-3)',
                color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
                fontSize: 'var(--font-size-xs)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
              }}
            >
              <Copy size={14} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <SectionCard title="Summary" body={notes.summary} accent />
          <SectionCard title="Key Points" items={notes.keyPoints} />
          {notes.scriptures.length > 0 && (
            <SectionCard title="Scriptures" body={notes.scriptures.join('  ·  ')} bodyStyle={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }} />
          )}
          {notes.themes.length > 0 && (
            <SectionCard title="Themes" body={notes.themes.join('  ·  ')} />
          )}
          {notes.actionItems.length > 0 && (
            <SectionCard title="Action Items" items={notes.actionItems} />
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
