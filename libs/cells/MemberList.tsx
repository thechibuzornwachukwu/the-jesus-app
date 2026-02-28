'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Shield, Crown, MoreHorizontal, X } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { kickMember, promoteToAdmin } from '../../lib/cells/actions';
import { Avatar } from '../shared-ui/Avatar';
import { BottomSheet } from '../shared-ui/BottomSheet';
import type { CellMemberWithProfile } from '../../lib/cells/types';

interface MemberListProps {
  open: boolean;
  onClose: () => void;
  cellId: string;
  currentUserId: string;
  userRole: 'admin' | 'member';
  onlineMemberIds: Set<string>;
}

export function MemberList({
  open,
  onClose,
  cellId,
  currentUserId,
  userRole,
  onlineMemberIds,
}: MemberListProps) {
  const [members, setMembers] = useState<CellMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionTarget, setActionTarget] = useState<CellMemberWithProfile | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from('cell_members')
      .select('cell_id, user_id, role, joined_at, profiles(id, username, avatar_url)')
      .eq('cell_id', cellId)
      .order('role', { ascending: false })
      .order('joined_at', { ascending: true })
      .then(({ data }) => {
        setMembers((data as unknown as CellMemberWithProfile[]) ?? []);
        setLoading(false);
      });
  }, [open, cellId]);

  const handleKick = (member: CellMemberWithProfile) => {
    startTransition(async () => {
      const result = await kickMember(cellId, member.user_id);
      if (!('error' in result)) {
        setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
      }
      setActionTarget(null);
    });
  };

  const handlePromote = (member: CellMemberWithProfile) => {
    startTransition(async () => {
      const result = await promoteToAdmin(cellId, member.user_id);
      if (!('error' in result)) {
        setMembers((prev) =>
          prev.map((m) => (m.user_id === member.user_id ? { ...m, role: 'admin' } : m))
        );
      }
      setActionTarget(null);
    });
  };

  const onlineCount = members.filter((m) => onlineMemberIds.has(m.user_id)).length;
  const admins = members.filter((m) => m.role === 'admin');
  const regularMembers = members.filter((m) => m.role === 'member');

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title={`Members${onlineCount > 0 ? ` · ${onlineCount} online` : ''}`}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 'var(--space-8)',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Loading…
          </div>
        ) : (
          <div>
            {admins.length > 0 && (
              <MemberSection
                label="Admins"
                members={admins}
                currentUserId={currentUserId}
                userRole={userRole}
                onlineMemberIds={onlineMemberIds}
                onAction={setActionTarget}
              />
            )}
            {regularMembers.length > 0 && (
              <MemberSection
                label={`Members — ${regularMembers.length}`}
                members={regularMembers}
                currentUserId={currentUserId}
                userRole={userRole}
                onlineMemberIds={onlineMemberIds}
                onAction={setActionTarget}
              />
            )}
          </div>
        )}
      </BottomSheet>

      {/* Admin action sheet */}
      {actionTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={() => setActionTarget(null)}
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <div
            style={{
              position: 'relative',
              background: 'var(--color-bg-surface)',
              borderTopLeftRadius: 'var(--radius-xl)',
              borderTopRightRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              borderBottom: 'none',
              padding: 'var(--space-4) var(--space-5)',
              paddingBottom: 'calc(var(--safe-bottom, 0px) + var(--space-5))',
            }}
          >
            {/* Handle */}
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-border)',
                margin: '0 auto var(--space-4)',
              }}
            />

            {/* Target user info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
                padding: 'var(--space-2) 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden' }}>
                <Avatar
                  src={actionTarget.profiles?.avatar_url}
                  name={actionTarget.profiles?.username}
                  size={36}
                />
              </div>
              <div>
                <p
                  style={{
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    margin: 0,
                  }}
                >
                  {actionTarget.profiles?.username ?? 'Unknown'}
                </p>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    margin: 0,
                    textTransform: 'capitalize',
                  }}
                >
                  {actionTarget.role}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {actionTarget.role === 'member' && (
                <ActionButton
                  icon={<Crown size={16} />}
                  label="Make Admin"
                  onClick={() => handlePromote(actionTarget)}
                />
              )}
              <ActionButton
                icon={<X size={16} />}
                label="Remove from Cell"
                danger
                onClick={() => handleKick(actionTarget)}
              />
              <ActionButton
                icon={null}
                label="Cancel"
                onClick={() => setActionTarget(null)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MemberSection({
  label,
  members,
  currentUserId,
  userRole,
  onlineMemberIds,
  onAction,
}: {
  label: string;
  members: CellMemberWithProfile[];
  currentUserId: string;
  userRole: 'admin' | 'member';
  onlineMemberIds: Set<string>;
  onAction: (m: CellMemberWithProfile) => void;
}) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <p
        style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 'var(--space-2)',
        }}
      >
        {label}
      </p>
      {members.map((member) => {
        const isOnline = onlineMemberIds.has(member.user_id);
        const isSelf = member.user_id === currentUserId;
        return (
          <div
            key={member.user_id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) 0',
            }}
          >
            {/* Avatar + online dot */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden' }}>
                <Avatar
                  src={member.profiles?.avatar_url}
                  name={member.profiles?.username}
                  size={36}
                />
              </div>
              {isOnline && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--color-success)',
                    border: '2px solid var(--color-bg)',
                  }}
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: 'var(--font-size-sm)',
                  color: isSelf ? 'var(--color-accent)' : 'var(--color-text)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isSelf ? 'You' : (member.profiles?.username ?? 'Unknown')}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>

            {/* Role badge */}
            {member.role === 'admin' && (
              <Shield size={13} color="var(--color-accent)" style={{ flexShrink: 0 }} />
            )}

            {/* Admin actions (only for others, not self) */}
            {userRole === 'admin' && !isSelf && (
              <button
                onClick={() => onAction(member)}
                aria-label={`Options for ${member.profiles?.username}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: 'var(--space-1)',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3)',
        background: 'none',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        color: danger ? 'var(--color-error)' : 'var(--color-text)',
        fontSize: 'var(--font-size-sm)',
        cursor: 'pointer',
        fontWeight: 'var(--font-weight-semibold)',
        textAlign: 'left',
        transition: 'background 0.1s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
