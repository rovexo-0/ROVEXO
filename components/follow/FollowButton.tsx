"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import styles from "@/components/follow/FollowButton.module.css";

export type FollowCounts = {
  followerCount: number;
  followingCount: number;
};

type FollowButtonProps = {
  userId: string;
  className?: string;
  initialFollowing?: boolean;
  /** Current profile counters (required on Public Profile). */
  followerCount?: number;
  followingCount?: number;
  onCountsChange?: (counts: FollowCounts) => void;
};

/**
 * Follow Engine v1.0 — canonical CTA.
 * FOLLOW ↔ ✓ FOLLOWING · optimistic target Followers · API persist · rollback.
 * No confirmation dialog · no modal · no page reload.
 */
export function FollowButton({
  userId,
  className,
  initialFollowing = false,
  followerCount = 0,
  followingCount = 0,
  onCountsChange,
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [seedFollowing, setSeedFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();
  const inFlight = useRef(false);

  if (initialFollowing !== seedFollowing) {
    setSeedFollowing(initialFollowing);
    setFollowing(initialFollowing);
  }

  const sync = useCallback(
    async (action: "follow" | "unfollow") => {
      if (inFlight.current || !userId) return;
      inFlight.current = true;

      const previousFollowing = following;
      const previousCounts: FollowCounts = { followerCount, followingCount };
      const nextFollowing = action === "follow";
      const optimisticCounts: FollowCounts = {
        followerCount: Math.max(
          0,
          previousCounts.followerCount + (action === "follow" ? 1 : -1),
        ),
        followingCount: previousCounts.followingCount,
      };

      setFollowing(nextFollowing);
      onCountsChange?.(optimisticCounts);

      try {
        const response = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, action }),
        });

        if (response.status === 401) {
          setFollowing(previousFollowing);
          onCountsChange?.(previousCounts);
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }

        const payload = (await response.json().catch(() => null)) as {
          success?: boolean;
          isFollowing?: boolean;
          followerCount?: number;
          followingCount?: number;
        } | null;

        if (!response.ok || !payload?.success) {
          setFollowing(previousFollowing);
          onCountsChange?.(previousCounts);
          return;
        }

        setFollowing(Boolean(payload.isFollowing));
        if (
          typeof payload.followerCount === "number" &&
          typeof payload.followingCount === "number"
        ) {
          onCountsChange?.({
            followerCount: payload.followerCount,
            followingCount: payload.followingCount,
          });
        }
      } catch {
        setFollowing(previousFollowing);
        onCountsChange?.(previousCounts);
      } finally {
        inFlight.current = false;
      }
    },
    [followerCount, following, followingCount, onCountsChange, router, userId],
  );

  function onPrimaryClick() {
    if (pending || inFlight.current) return;
    const action = following ? "unfollow" : "follow";
    startTransition(() => {
      void sync(action);
    });
  }

  return (
    <div className={cn(styles.root, className)} data-follow-button="follow-engine-v1.0">
      <button
        type="button"
        className={cn(
          styles.btn,
          following ? styles.following : styles.follow,
          focusRing,
        )}
        aria-pressed={following}
        aria-busy={pending}
        aria-label={following ? "Following" : "Follow"}
        disabled={pending}
        onClick={onPrimaryClick}
      >
        {following ? (
          <>
            <CheckIcon />
            <span>FOLLOWING</span>
          </>
        ) : (
          <span>FOLLOW</span>
        )}
      </button>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 10 17.5 19 7"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
