'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Heart } from 'lucide-react';
import { ProfileHeader, PostedVideoGrid, FollowersSheet, FollowingSheet } from '../../../../libs/profile';
import { followUser, unfollowUser } from '../../../../lib/profile/actions';
import { vibrate } from '../../../../libs/shared-ui/haptics';
import type { PublicProfile, PostedVideo, Post } from '../../../../libs/profile/types';

interface PublicProfileClientProps {
  profile: PublicProfile;
  postedVideos: PostedVideo[];
  posts: Post[];
  viewerId: string;
}

// Convert PublicProfile → FullProfile shape (ProfileHeader needs FullProfile)
function toFullProfile(p: PublicProfile) {
  return {
    id: p.id,
    username: p.username,
    avatar_url: p.avatar_url,
    bio: p.bio,
    church_name: p.church_name,
    city: p.city,
    is_public: p.is_public,
    content_categories: [],
    deleted_at: null,
  };
}

function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {posts.map((p) => (
        <div
          key={p.id}
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            border: '1px solid var(--color-border)',
          }}
        >
          {p.verse_reference && (
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
              {p.verse_reference}
            </p>
          )}
          {p.verse_text && (
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
              {p.verse_text}
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
            {p.content}
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
            <span>{p.like_count}</span>
            <span style={{ marginLeft: 'var(--space-2)' }}>
              {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicProfileClient({
  profile: initialProfile,
  postedVideos,
  posts,
}: PublicProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [isFollowPending, startFollowTransition] = useTransition();

  const showContent = profile.is_public || profile.is_following;
  const hasVideos = postedVideos.length > 0;
  const hasPosts = posts.length > 0;

  function handleFollowToggle() {
    vibrate([8]);
    const next = !profile.is_following;
    setProfile((prev) => ({
      ...prev,
      is_following: next,
      follower_count: Math.max(0, prev.follower_count + (next ? 1 : -1)),
    }));
    startFollowTransition(async () => {
      const { error } = next
        ? await followUser(profile.id)
        : await unfollowUser(profile.id);
      if (error) {
        // revert
        setProfile((prev) => ({
          ...prev,
          is_following: !next,
          follower_count: Math.max(0, prev.follower_count + (next ? -1 : 1)),
        }));
      }
    });
  }

  return (
    <>
      <style>{`
        @keyframes pub-slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pub-section { animation: pub-slide-up 0.3s ease both; }
        .pub-section:nth-child(1) { animation-delay: 0ms; }
        .pub-section:nth-child(2) { animation-delay: 60ms; }
        .pub-section:nth-child(3) { animation-delay: 120ms; }
        .pub-back-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text);
          padding: var(--space-2);
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          transition: background 0.12s, color 0.12s;
        }
        .pub-back-btn:hover {
          background: var(--color-accent-soft);
          color: var(--color-accent);
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          background: 'var(--color-bg)',
        }}
      >
        {/* Top bar */}
        <div
          className="pub-section"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: 'var(--space-3) var(--space-4) var(--space-2)',
            flexShrink: 0,
          }}
        >
          <button
            className="pub-back-btn"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Profile Header */}
        <div className="pub-section">
          <ProfileHeader
            profile={toFullProfile(profile)}
            streakCount={0}
            followerCount={profile.follower_count}
            followingCount={profile.following_count}
            isOwnProfile={false}
            isFollowing={profile.is_following}
            isFollowPending={isFollowPending}
            onFollowToggle={handleFollowToggle}
            onFollowersClick={() => setFollowersOpen(true)}
            onFollowingClick={() => setFollowingOpen(true)}
          />
        </div>

        {/* Content */}
        {showContent && (hasVideos || hasPosts) && (
          <div
            className="pub-section"
            style={{ padding: 'var(--space-4)', paddingBottom: 'var(--space-10)' }}
          >
            {hasVideos && (
              <>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 'var(--font-weight-semibold)',
                    margin: '0 0 var(--space-3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <BookOpen size={12} /> Videos
                </p>
                <PostedVideoGrid videos={postedVideos} />
              </>
            )}

            {hasPosts && (
              <>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 'var(--font-weight-semibold)',
                    margin: `${hasVideos ? 'var(--space-6)' : '0'} 0 var(--space-3)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <BookOpen size={12} /> Reflections
                </p>
                <PostGrid posts={posts} />
              </>
            )}
          </div>
        )}

        {/* Sheets */}
        <FollowersSheet
          open={followersOpen}
          onClose={() => setFollowersOpen(false)}
          userId={profile.id}
        />
        <FollowingSheet
          open={followingOpen}
          onClose={() => setFollowingOpen(false)}
          userId={profile.id}
        />
      </div>
    </>
  );
}
