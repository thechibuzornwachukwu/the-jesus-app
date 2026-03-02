'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X } from 'lucide-react';
import { BottomSheet } from '../shared-ui';
import type { ChatMessage } from './types';

function newUUID(): string {
  return crypto.randomUUID();
}

function CrossIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="8" x2="22" y2="8" />
    </svg>
  );
}

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    'Welcome, Berean. Ask anything about Scripture, a verse, a doctrine, a question of faith. I search the Scriptures to walk with you.',
};

interface SpiritualGuideProps {
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

export function SpiritualGuide({ externalOpen, onExternalClose }: SpiritualGuideProps = {}) {
  const isOpen = externalOpen ?? false;
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => newUUID());
  const messagesPaneRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    const pane = messagesPaneRef.current;
    if (!pane) return;
    pane.scrollTo({ top: pane.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    scrollToBottom();
    const id = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, [isOpen, messages, loading, scrollToBottom]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/learn/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.filter((m) => m.role !== 'assistant' || m !== WELCOME).slice(-10),
          sessionId,
        }),
      });

      if (!res.ok) throw new Error('Request failed');
      const { answer } = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatContent(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <>
      <BottomSheet
        open={isOpen}
        onClose={() => onExternalClose?.()}
        contentScrollable={false}
        contentStyle={{
          display: 'flex',
          flexDirection: 'column',
          height: 'min(84dvh, calc(100dvh - var(--space-8)))',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            borderBottom: '1px solid var(--color-border)',
            padding: 'var(--space-3) var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            background: 'var(--color-bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{ color: 'var(--color-accent)' }}>
              <CrossIcon />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Berean
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Search the Scriptures daily, Acts 17:11
              </p>
            </div>
          </div>

          <button
            onClick={() => onExternalClose?.()}
            aria-label="Close Berean"
            style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-muted)',
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          ref={messagesPaneRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            background: 'var(--color-bg-surface)',
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '82%',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius:
                    msg.role === 'user'
                      ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                      : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                  background:
                    msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-accent-tint)',
                  borderLeft:
                    msg.role === 'assistant' ? '2px solid var(--color-accent-soft)' : undefined,
                  color:
                    msg.role === 'user'
                      ? 'var(--color-text-inverse)'
                      : 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: 'var(--line-height-relaxed)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.role === 'assistant' ? formatContent(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-bg-surface)',
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                }}
              >
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: 'var(--color-text-muted)',
                      display: 'inline-block',
                      animation: `bounce 1.2s ${d * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid var(--color-border)',
            padding: 'var(--space-3) var(--space-4)',
            paddingBottom: 'calc(var(--safe-bottom, 0px) + var(--space-3))',
            display: 'flex',
            gap: 'var(--space-2)',
            alignItems: 'flex-end',
            background: 'var(--color-bg-surface)',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about faith, Scripture, life..."
            rows={1}
            className="field-textarea"
            style={{
              flex: 1,
              borderRadius: 'var(--radius-lg)',
              maxHeight: 120,
              overflowY: 'auto',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            aria-label="Send"
            style={{
              background: 'var(--color-accent)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-inverse)',
              cursor: 'pointer',
              flexShrink: 0,
              opacity: !input.trim() || loading ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </BottomSheet>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
