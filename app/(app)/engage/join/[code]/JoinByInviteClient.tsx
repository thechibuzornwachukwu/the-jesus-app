'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowRight, AlertCircle } from 'lucide-react';
import { Avatar } from '../../../../../libs/shared-ui/Avatar';
import { Badge } from '../../../../../libs/shared-ui/Badge';
import { joinByInvite } from '../../../../../lib/cells/actions';

interface CellPreview {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  avatar_url: string | null;
  is_public: boolean;
  member_count: number;
}

interface JoinByInviteClientProps {
  code: string;
  cell: CellPreview | null;
  alreadyMember: boolean;
  invalidReason: string | null;
}

export function JoinByInviteClient({
  code,
  cell,
  alreadyMember,
  invalidReason,
}: JoinByInviteClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = () => {
    setJoining(true);
    setError(null);
    startTransition(async () => {
      const result = await joinByInvite(code);
      if ('error' in result) {
        setError(result.error);
        setJoining(false);
      } else {
        router.push(`/engage/${result.cellSlug}/info`);
      }
    });
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        {/* Header accent strip */}
        <div
          style={{
            height: 6,
            background: 'linear-gradient(90deg, var(--color-accent), rgba(244,117,33,0.3))',
          }}
        />

        <div style={{ padding: 'var(--space-6)' }}>
          {invalidReason ? (
            /* Invalid invite */
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(248,113,113,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                }}
              >
                <AlertCircle size={24} color="var(--color-error)" />
              </div>
              <h2
                style={{
                  fontFamily: "'Archivo Condensed', var(--font-display)",
                  fontWeight: 900,
                  fontSize: 'var(--font-size-xl)',
                  color: 'var(--color-text)',
                  margin: '0 0 var(--space-2)',
                }}
              >
                Invalid Invite
              </h2>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-5)',
                  lineHeight: 'var(--line-height-normal)',
                }}
              >
                {invalidReason}
              </p>
              <button
                onClick={() => router.push('/engage')}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  background: 'var(--color-surface-high)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: 'var(--font-size-base)',
                  cursor: 'pointer',
                }}
              >
                Browse Cells
              </button>
            </div>
          ) : cell ? (
            /* Valid invite — show cell info */
            <div>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  marginBottom: 'var(--space-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}
              >
                You&apos;ve been invited to join
              </p>

              {/* Cell card preview */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  marginBottom: 'var(--space-5)',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <Avatar src={cell.avatar_url} name={cell.name} size={52} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-base)',
                      color: 'var(--color-text)',
                      margin: '0 0 4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {cell.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge variant="default">{cell.category}</Badge>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <Users size={11} />
                      {cell.member_count}
                    </span>
                  </div>
                </div>
              </div>

              {cell.description && (
                <p
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                    lineHeight: 'var(--line-height-normal)',
                    marginBottom: 'var(--space-5)',
                  }}
                >
                  {cell.description}
                </p>
              )}

              {error && (
                <p
                  style={{
                    color: 'var(--color-error)',
                    fontSize: 'var(--font-size-xs)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  {error}
                </p>
              )}

              {alreadyMember ? (
                <button
                  onClick={() => router.push(`/engage/${cell.slug}`)}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    background: 'var(--color-accent)',
                    color: 'var(--color-accent-text)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-base)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  You&apos;re already a member — Enter
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    background: joining ? 'var(--color-surface-high)' : 'var(--color-accent)',
                    color: joining ? 'var(--color-text-muted)' : 'var(--color-accent-text)',
                    border: joining ? '1px solid var(--color-border)' : 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-base)',
                    cursor: joining ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    transition: 'background 0.15s',
                  }}
                >
                  {joining ? 'Joining…' : `Join ${cell.name}`}
                  {!joining && <ArrowRight size={16} />}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
