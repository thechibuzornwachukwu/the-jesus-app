'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Link2,
  Copy,
  Check,
  Crown,
  Pencil,
  Share2,
  Shield,
  User,
  Users,
  BookOpen,
  ChevronLeft,
} from 'lucide-react';
import { Avatar } from '../shared-ui/Avatar';
import { Badge } from '../shared-ui/Badge';
import { joinCell, createInvite } from '../../lib/cells/actions';
import type { Cell, CellMemberWithProfile } from '../../lib/cells/types';
import { EditCellSheet } from './EditCellSheet';

interface CellInfoPageProps {
  cell: Cell;
  memberCount: number;
  membersPreview: CellMemberWithProfile[];
  isMember: boolean;
  userRole: 'admin' | 'member' | null;
  permanentInviteCode?: string | null;
}

export function CellInfoPage({
  cell,
  memberCount,
  membersPreview,
  isMember,
  userRole,
  permanentInviteCode,
}: CellInfoPageProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copiedPermanent, setCopiedPermanent] = useState(false);
  const [tempInviteCode, setTempInviteCode] = useState<string | null>(null);
  const [copiedTemp, setCopiedTemp] = useState(false);
  const [generatingTemp, setGeneratingTemp] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);

  useEffect(() => { setHasMounted(true); }, []);
  const showShareButton = hasMounted && !!navigator.share;

  const getFullLink = (code: string) =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/engage/join/${code}`
      : `/engage/join/${code}`;

  const handleJoin = () => {
    setJoining(true);
    setJoinError(null);
    startTransition(async () => {
      const result = await joinCell(cell.id);
      if ('error' in result) {
        setJoinError(result.error);
        setJoining(false);
      } else {
        router.push(`/engage/${cell.slug}`);
      }
    });
  };

  const handleCopyPermanent = async () => {
    if (!permanentInviteCode) return;
    await navigator.clipboard.writeText(getFullLink(permanentInviteCode));
    setCopiedPermanent(true);
    setTimeout(() => setCopiedPermanent(false), 2000);
  };

  const handleShare = async (code: string) => {
    if (!navigator.share) return;
    await navigator.share({ title: `Join ${cell.name}`, url: getFullLink(code) });
  };

  const handleGenerateTempInvite = async () => {
    setGeneratingTemp(true);
    const result = await createInvite(cell.id, 7);
    if ('code' in result) setTempInviteCode(result.code);
    setGeneratingTemp(false);
  };

  const handleCopyTemp = async () => {
    if (!tempInviteCode) return;
    await navigator.clipboard.writeText(getFullLink(tempInviteCode));
    setCopiedTemp(true);
    setTimeout(() => setCopiedTemp(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Back button */}
      <button
        onClick={() => router.back()}
        aria-label="Back"
        style={{
          position: 'absolute',
          top: 'calc(var(--safe-top, 0px) + 12px)',
          left: 12,
          zIndex: 10,
          background: 'rgba(4,5,3,0.55)',
          backdropFilter: 'blur(8px)',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text)',
          cursor: 'pointer',
        }}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Banner */}
      <div
        style={{
          position: 'relative',
          height: 180,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {cell.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cell.banner_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background:
                'radial-gradient(ellipse 120% 100% at 50% 0%, rgba(212,146,42,0.30) 0%, var(--color-sidebar) 70%, var(--color-bg) 100%)',
            }}
          />
        )}
        {/* gradient overlay at bottom */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, var(--color-bg) 100%)',
          }}
        />
      </div>

      {/* Avatar overlapping banner */}
      <div
        style={{
          marginTop: -40,
          paddingLeft: 'var(--space-5)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            overflow: 'hidden',
            border: '3px solid var(--color-bg)',
            boxShadow: '0 0 0 1px var(--color-border)',
          }}
        >
          <Avatar src={cell.avatar_url} name={cell.name} size={72} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 'var(--space-3) var(--space-5) var(--space-8)', flex: 1 }}>
        {/* Name + meta */}
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <h1
            style={{
              fontFamily: "'Archivo Condensed', var(--font-display)",
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 900,
              letterSpacing: 'var(--letter-spacing-tight)',
              color: 'var(--color-text)',
              margin: '0 0 var(--space-2)',
              lineHeight: 1.1,
            }}
          >
            {cell.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Badge variant="default">{cell.category}</Badge>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              <Users size={12} />
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </span>
            {!cell.is_public && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Shield size={12} />
                Private
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {cell.description && (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              lineHeight: 'var(--line-height-normal)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {cell.description}
          </p>
        )}

        {/* Members preview row */}
        {membersPreview.length > 0 && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              Members
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {membersPreview.slice(0, 10).map((m) => (
                <div
                  key={m.user_id}
                  title={`${m.profiles?.username ?? 'Unknown'}${m.role === 'admin' ? ' (Admin)' : ''}`}
                  style={{ position: 'relative', flexShrink: 0 }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '2px solid var(--color-bg)',
                      boxShadow: '0 0 0 1px var(--color-border)',
                    }}
                  >
                    <Avatar
                      src={m.profiles?.avatar_url}
                      name={m.profiles?.username}
                      size={36}
                    />
                  </div>
                  {m.role === 'admin' && (
                    <span
                      aria-label="Admin"
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'var(--color-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid var(--color-bg)',
                      }}
                    >
                      <Crown size={8} color="var(--color-accent-text)" strokeWidth={2.5} />
                    </span>
                  )}
                </div>
              ))}
              {memberCount > 10 && (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    fontWeight: 600,
                  }}
                >
                  +{memberCount - 10}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rules */}
        {cell.rules && (
          <div
            style={{
              marginBottom: 'var(--space-5)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 'var(--space-2)',
              }}
            >
              <BookOpen size={13} color="var(--color-accent)" />
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: 0,
                }}
              >
                Cell Rules
              </p>
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                lineHeight: 'var(--line-height-normal)',
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {cell.rules}
            </p>
          </div>
        )}

        {/* CTA */}
        {joinError && (
          <p
            style={{
              color: 'var(--color-error)',
              fontSize: 'var(--font-size-xs)',
              marginBottom: 'var(--space-2)',
            }}
          >
            {joinError}
          </p>
        )}

        {isMember ? (
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
              marginBottom: 'var(--space-3)',
            }}
          >
            Enter Cell
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              background: joining ? 'var(--color-surface)' : 'var(--color-accent)',
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
              marginBottom: 'var(--space-3)',
              transition: 'background 0.15s',
            }}
          >
            {joining ? (
              'Joining…'
            ) : (
              <>
                <User size={16} />
                {cell.is_public ? 'Join Cell' : 'Request to Join'}
              </>
            )}
          </button>
        )}

        {/* Share This Cell  visible to all members with a permanent invite */}
        {isMember && permanentInviteCode && (
          <div
            style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 'var(--space-3)',
              }}
            >
              <Link2 size={13} color="var(--color-accent)" />
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Share This Cell
              </span>
            </div>

            {/* Permanent link row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                border: '1px solid var(--color-border)',
              }}
            >
              <code
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'monospace',
                }}
              >
                /engage/join/{permanentInviteCode}
              </code>
              <button
                onClick={handleCopyPermanent}
                aria-label="Copy link"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: copiedPermanent ? 'var(--color-success)' : 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                  flexShrink: 0,
                  transition: 'color 0.15s',
                }}
              >
                {copiedPermanent ? <Check size={15} /> : <Copy size={15} />}
              </button>
              {showShareButton && (
                <button
                  onClick={() => handleShare(permanentInviteCode)}
                  aria-label="Share"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <Share2 size={15} />
                </button>
              )}
            </div>

            {/* Admin-only: generate a temporary one-time invite */}
            {userRole === 'admin' && (
              <div
                style={{
                  marginTop: 'var(--space-3)',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    margin: '0 0 var(--space-2)',
                  }}
                >
                  Temporary invite (7-day expiry)
                </p>
                {tempInviteCode ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 10px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <code
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'monospace',
                      }}
                    >
                      /engage/join/{tempInviteCode}
                    </code>
                    <button
                      onClick={handleCopyTemp}
                      aria-label="Copy temp link"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedTemp ? 'var(--color-success)' : 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                        flexShrink: 0,
                        transition: 'color 0.15s',
                      }}
                    >
                      {copiedTemp ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateTempInvite}
                    disabled={generatingTemp}
                    style={{
                      background: 'var(--color-accent-soft)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-accent)',
                      fontWeight: 600,
                      cursor: generatingTemp ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {generatingTemp ? 'Generating…' : 'Generate Temp Link'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Admin  edit cell */}
        {userRole === 'admin' && (
          <button
            onClick={() => setShowEditSheet(true)}
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-3)',
            }}
          >
            <Pencil size={15} />
            Edit Cell
          </button>
        )}
      </div>

      {userRole === 'admin' && (
        <EditCellSheet
          open={showEditSheet}
          onClose={() => setShowEditSheet(false)}
          cell={cell}
        />
      )}
    </div>
  );
}
