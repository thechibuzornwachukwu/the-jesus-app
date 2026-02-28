'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { FAB, FullScreenModal } from '../shared-ui';
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
    "Peace be with you 🕊️ I'm here to walk through Scripture with you. Ask me anything — a question about faith, a struggle you're facing, or a verse you want to understand more deeply.",
};

export function SpiritualGuide() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => newUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages, scrollToBottom]);

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

  const inputBar = (
    <div
      style={{
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-3) var(--space-4)',
        paddingBottom: 'calc(var(--safe-bottom) + var(--space-3))',
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
        placeholder="Ask anything about faith, Scripture, life…"
        rows={1}
        style={{
          flex: 1,
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          resize: 'none',
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          lineHeight: 'var(--line-height-normal)',
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
  );

  return (
    <>
      <FAB
        onClick={() => setOpen(true)}
        icon={<CrossIcon />}
        ariaLabel="Ask the Spirit"
        size={56}
        bottomOffset="var(--space-6)"
        zIndex="var(--z-modal)"
      />

      <FullScreenModal
        open={open}
        onClose={() => setOpen(false)}
        title="Ask the Spirit"
        subtitle="Scripture-grounded guidance"
        icon={<CrossIcon />}
        footerContent={inputBar}
        zIndex="calc(var(--z-modal) + 1)"
      >
        <div
          style={{
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
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
                    msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-bg-surface)',
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
          <div ref={messagesEndRef} />
        </div>
      </FullScreenModal>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
