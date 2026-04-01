'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  Settings,
  Pencil,
  MessageCircle,
  Heart,
  BookOpen,
  Bookmark,
  UserCheck,
  UserPlus,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { ProfileHeader } from '../../../../libs/profile/ProfileHeader';
import { SavedVersesList } from '../../../../libs/profile/SavedVersesList';
import { PostedVideoGrid } from '../../../../libs/profile/PostedVideoGrid';
import { FollowersSheet } from '../../../../libs/profile/FollowersSheet';
import { FollowingSheet } from '../../../../libs/profile/FollowingSheet';
import { StreakWidget } from '../../../../libs/profile/StreakWidget';
import { TabBar } from '../../../../libs/shared-ui/TabBar';
import { EmptyState } from '../../../../libs/shared-ui/EmptyState';
import { followUser, unfollowUser } from '../../../../lib/profile/actions';
import { vibrate } from '../../../../libs/shared-ui/haptics';
import type { FullProfile, SavedVerse, PostedVideo, Post } from '../../../../libs/profile/types';
import type { StreakData } from '../../../../lib/profile/actions';

type OwnerTab = 'posts' | 'videos' | 'saved';
type VisitorTab = 'posts' | 'videos';

// ── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        border: '1px solid var(--color-border)',
      }}
    >
      {post.verse_reference && (
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-accent)',
            fontWeight: 'var(--font-weight-semibold)',
            margin: '0 0 var(--space-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {post.verse_reference}
        </p>
      )}
      {post.verse_text && (
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
            lineHeight: 'var(--line-height-relaxed)',
            margin: '0 0 var(--space-3)',
            paddingLeft: 'var(--space-3)',
            borderLeft: '2px solid var(--color-accent)',
          }}
        >
          {post.verse_text}
        </p>
      )}
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text)',
          lineHeight: 'var(--line-height-relaxed)',
          margin: 0,
        }}
      >
        {post.content}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          marginTop: 'var(--space-3)',
          color: 'var(--color-text-faint)',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        <Heart size={11} />
        <span>{post.like_count}</span>
        <span style={{ marginLeft: 'var(--space-2)' }}>
          {new Date(post.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}

// ── Icon button ──────────────────────────────────────────────────────────────
function IconBtn({
  onClick,
  label,
  badge,
  children,
}: {
  onClick: () => void;
  label: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--color-text)',
        padding: 'var(--space-2)',
        position: 'relative',
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 'var(--radius-full)',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-soft)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'none';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)';
      }}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 16,
            height: 16,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-accent)',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────
interface ProfilePageClientProps {
  isOwner: boolean;
  profile: FullProfile;
  savedVerses: SavedVerse[];
  postedVideos: PostedVideo[];
  posts: Post[];
  unreadCount: number;
  followerCount: number;
  followingCount: number;
  streakData: StreakData;
  viewerId: string;
  isFollowing?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────
export function ProfilePageClient({
  isOwner,
  profile: initialProfile,
  savedVerses,
  postedVideos,
  posts,
  unreadCount,
  followerCount: initialFollowerCount,
  followingCount,
  streakData,
  isFollowing: initialIsFollowing = false,
}: ProfilePageClientProps) {
  const router = useRouter();

  // Visitor follow state
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isFollowPending, startFollowTransition] = useTransition();

  // Sheets
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  // Tabs
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('posts');
  const [visitorTab, setVisitorTab] = useState<VisitorTab>('posts');

  const showContent =
    isOwner || initialProfile.is_public || isFollowing;

  function handleFollowToggle() {
    vibrate([8]);
    const next = !isFollowing;
    setIsFollowing(next);
    setFollowerCount((c) => Math.max(0, c + (next ? 1 : -1)));
    startFollowTransition(async () => {
      const { error } = next
        ? await followUser(initialProfile.id)
        : await unfollowUser(initialProfile.id);
      if (error) {
        setIsFollowing(!next);
        setFollowerCount((c) => Math.max(0, c + (next ? -1 : 1)));
      }
    });
  }

  // ── Owner top bar ──────────────────────────────────────────────────────────
  const ownerTopBar = (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-overlay)' as React.CSSProperties['zIndex'],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'calc(var(--safe-top) + var(--space-3)) var(--space-4) var(--space-2)',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          color: 'var(--color-text)',
        }}
      >
        @{initialProfile.username}
      </h1>
      <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
        <IconBtn
          onClick={() => router.push(`/profile/${initialProfile.username}/edit`)}
          label="Edit profile"
        >
          <Pencil size={20} />
        </IconBtn>
        <IconBtn
          onClick={() => router.push(`/chat`)}
          label="Messages"
        >
          <MessageCircle size={20} />
        </IconBtn>
        <IconBtn
          onClick={() => router.push(`/profile/${initialProfile.username}/notifications`)}
          label="Notifications"
          badge={unreadCount}
        >
          <Bell size={20} />
        </IconBtn>
        <IconBtn
          onClick={() => router.push(`/profile/${initialProfile.username}/settings`)}
          label="Settings"
        >
          <Settings size={20} />
        </IconBtn>
      </div>
    </div>
  );

  // ── Visitor top bar ────────────────────────────────────────────────────────
  const visitorTopBar = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'calc(var(--safe-top) + var(--space-2)) var(--space-4) var(--space-2)',
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: 'var(--space-2)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          transition: 'background 0.12s',
        }}
      >
        <ArrowLeft size={20} />
      </button>

      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        {/* Message button */}
        <button
          onClick={() => router.push(`/chat/${initialProfile.id}`)}
          aria-label="Send message"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <MessageSquare size={15} />
          Message
        </button>

        {/* Follow button */}
        <button
          onClick={handleFollowToggle}
          disabled={isFollowPending}
          aria-label={isFollowing ? 'Unfollow' : 'Follow'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 20px',
            borderRadius: 'var(--radius-full)',
            border: isFollowing ? '1px solid var(--color-border)' : 'none',
            background: isFollowing ? 'transparent' : 'var(--color-accent)',
            color: isFollowing ? 'var(--color-text-muted)' : 'var(--color-accent-text)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: isFollowPending ? 'default' : 'pointer',
            opacity: isFollowPending ? 0.6 : 1,
            transition: 'background 0.15s, opacity 0.15s',
          }}
        >
          {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
        </button>
      </div>
    </div>
  );

  // ── Owner tabs ─────────────────────────────────────────────────────────────
  const ownerTabsEl = (
    <div style={{ marginTop: 'var(--space-2)' }}>
      <TabBar
        tabs={[
          { id: 'posts', label: 'Posts', icon: <BookOpen size={15} /> },
          { id: 'videos', label: 'Videos', icon: <BookOpen size={15} /> },
          { id: 'saved', label: 'Saved', icon: <Bookmark size={15} /> },
        ]}
        activeId={ownerTab}
        onChange={(id) => setOwnerTab(id as OwnerTab)}
        variant="underline"
      />
      <div
        key={ownerTab}
        style={{
          padding: 'var(--space-4)',
          paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-4))',
          animation: 'tab-fade 0.18s ease-out both',
        }}
      >
        {ownerTab === 'posts' && (
          posts.length > 0
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {posts.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            : <EmptyState icon={<BookOpen size={32} />} message="Share your first reflection in Explore." />
        )}
        {ownerTab === 'videos' && (
          postedVideos.length > 0
            ? <PostedVideoGrid videos={postedVideos} />
            : <EmptyState icon={<BookOpen size={32} />} message="Your shared videos will appear here." />
        )}
        {ownerTab === 'saved' && (
          savedVerses.length > 0
            ? <SavedVersesList verses={savedVerses} />
            : <EmptyState icon={<Bookmark size={32} />} message="Verses you save will appear here." />
        )}
      </div>
    </div>
  );

  // ── Visitor tabs ───────────────────────────────────────────────────────────
  const visitorTabsEl = showContent ? (
    <div style={{ marginTop: 'var(--space-2)' }}>
      <TabBar
        tabs={[
          { id: 'posts', label: 'Posts', icon: <BookOpen size={15} /> },
          { id: 'videos', label: 'Videos', icon: <BookOpen size={15} /> },
        ]}
        activeId={visitorTab}
        onChange={(id) => setVisitorTab(id as VisitorTab)}
        variant="underline"
      />
      <div
        key={visitorTab}
        style={{
          padding: 'var(--space-4)',
          paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-4))',
          animation: 'tab-fade 0.18s ease-out both',
        }}
      >
        {visitorTab === 'posts' && (
          posts.length > 0
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {posts.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            : <EmptyState icon={<BookOpen size={32} />} message="No reflections yet." />
        )}
        {visitorTab === 'videos' && (
          postedVideos.length > 0
            ? <PostedVideoGrid videos={postedVideos} />
            : <EmptyState icon={<BookOpen size={32} />} message="No videos yet." />
        )}
      </div>
    </div>
  ) : (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-8) var(--space-4)',
        color: 'var(--color-text-faint)',
      }}
    >
      <Lock size={28} style={{ opacity: 0.4 }} />
      <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>
        Follow to see their posts and videos.
      </p>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes tab-fade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--color-bg)' }}>
        {isOwner ? ownerTopBar : visitorTopBar}

        <ProfileHeader
          profile={initialProfile}
          streakCount={streakData.current}
          followerCount={followerCount}
          followingCount={followingCount}
          isOwnProfile={isOwner}
          isFollowing={isFollowing}
          isFollowPending={isFollowPending}
          onFollowToggle={isOwner ? undefined : handleFollowToggle}
          onFollowersClick={() => { vibrate([6]); setFollowersOpen(true); }}
          onFollowingClick={() => { vibrate([6]); setFollowingOpen(true); }}
        />

        {isOwner && (
          <StreakWidget current={streakData.current} longest={streakData.longest} />
        )}

        {isOwner ? ownerTabsEl : visitorTabsEl}

        <FollowersSheet
          open={followersOpen}
          onClose={() => setFollowersOpen(false)}
          userId={initialProfile.id}
        />
        <FollowingSheet
          open={followingOpen}
          onClose={() => setFollowingOpen(false)}
          userId={initialProfile.id}
        />
      </div>
    </>
  );
}
