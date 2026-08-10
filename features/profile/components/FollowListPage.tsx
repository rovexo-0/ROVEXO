"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { FollowButton } from "@/components/follow/FollowButton";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import {
  followListCacheKey,
  readFollowListCache,
  writeFollowListCache,
  type FollowListCacheItem,
} from "@/lib/follow/follow-list-memory-cache-v1";
import "@/styles/rovexo/view-profile-v1.css";

type FollowListItem = FollowListCacheItem;

type FollowListPageProps = {
  userId: string;
  username: string;
  mode: "followers" | "following";
  backHref: string;
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 200;

export function FollowListPage({ userId, username, mode, backHref }: FollowListPageProps) {
  const initialKey = followListCacheKey(userId, mode, "");
  const initialCache = readFollowListCache(initialKey);

  const [items, setItems] = useState<FollowListItem[]>(() => initialCache?.items ?? []);
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(() => initialCache?.offset ?? 0);
  const [hasMore, setHasMore] = useState(() => initialCache?.hasMore ?? true);
  const [loading, setLoading] = useState(() => !initialCache);
  const [pending, startTransition] = useTransition();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (nextOffset: number, replace: boolean, query: string) => {
      const key = followListCacheKey(userId, mode, query);
      const cached = replace && nextOffset === 0 ? readFollowListCache(key) : null;

      // Instant paint from memory — never clear visible rows for a soft refresh.
      if (cached && replace) {
        setItems(cached.items);
        setHasMore(cached.hasMore);
        setOffset(cached.offset);
        setLoading(false);
      } else if (replace) {
        setItems([]);
        setHasMore(true);
        setOffset(0);
        setLoading(true);
      } else {
        setLoading(true);
      }

      const id = ++requestId.current;
      try {
        const params = new URLSearchParams({
          userId,
          list: mode,
          limit: String(PAGE_SIZE),
          offset: String(nextOffset),
        });
        if (query.trim()) params.set("q", query.trim());
        const response = await fetch(`/api/follows?${params.toString()}`);
        const payload = (await response.json().catch(() => null)) as {
          items?: FollowListItem[];
        } | null;
        if (id !== requestId.current) return;

        const next = payload?.items ?? [];
        const nextHasMore = next.length >= PAGE_SIZE;
        const nextOffsetEnd = nextOffset + next.length;

        setItems((prev) => {
          const result = replace ? next : [...prev, ...next];
          writeFollowListCache(key, {
            items: result,
            hasMore: nextHasMore,
            offset: nextOffsetEnd,
          });
          return result;
        });
        setHasMore(nextHasMore);
        setOffset(nextOffsetEnd);
      } catch {
        if (id !== requestId.current) return;
        if (replace && !cached) setItems([]);
        setHasMore(false);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [mode, userId],
  );

  useEffect(() => {
    startTransition(() => {
      void load(0, true, "");
    });
  }, [load, startTransition]);

  // Warm the sibling list (Followers ↔ Following) in the background.
  useEffect(() => {
    const sibling: "followers" | "following" =
      mode === "followers" ? "following" : "followers";
    const key = followListCacheKey(userId, sibling, "");
    if (readFollowListCache(key)) return;

    let cancelled = false;
    const params = new URLSearchParams({
      userId,
      list: sibling,
      limit: String(PAGE_SIZE),
      offset: "0",
    });

    void fetch(`/api/follows?${params.toString()}`)
      .then((response) => response.json().catch(() => null))
      .then((payload: { items?: FollowListItem[] } | null) => {
        if (cancelled || !payload) return;
        const next = payload.items ?? [];
        writeFollowListCache(key, {
          items: next,
          hasMore: next.length >= PAGE_SIZE,
          offset: next.length,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [mode, userId]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  function onSearch(value: string) {
    setQ(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      startTransition(() => {
        void load(0, true, value);
      });
    }, SEARCH_DEBOUNCE_MS);
  }

  const title = mode === "followers" ? "Followers" : "Following";
  const showEmpty = items.length === 0 && !loading;

  return (
    <BetaAppShell>
      <div className="vp-v1" data-follow-list={mode} data-full-width-engine="v1.0">
        <CanonicalPageHeader title={title} backHref={backHref} />
        <HubPageMain className="vp-v1__main">
          <p className="vp-v1__username" style={{ marginBottom: 12 }}>
            @{username}
          </p>
          <label className="sr-only" htmlFor="follow-search">
            Search
          </label>
          <input
            id="follow-search"
            type="search"
            className={cn("vp-v1__follow-search", focusRing)}
            placeholder="Search"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
          />

          {showEmpty ? (
            <EmptyState
              title={mode === "followers" ? "No followers yet" : "Not following anyone"}
              description="Marketplace follows update when members follow this profile."
            />
          ) : items.length > 0 ? (
            <ul className="vp-v1__follow-list">
              {items.map((item) => (
                <li key={item.id} className="vp-v1__follow-row-item">
                  <Link
                    href={`/user/${encodeURIComponent(item.username)}`}
                    className="vp-v1__follow-identity"
                  >
                    <Avatar
                      src={item.avatarUrl}
                      alt={item.username}
                      name={item.username}
                      size="md"
                    />
                    <span>
                      <strong>@{item.username}</strong>
                      <span className="vp-v1__follow-meta">
                        {item.rating > 0 ? item.rating.toFixed(1) : "0.0"} ★ ·{" "}
                        {item.reviewCount} reviews
                      </span>
                    </span>
                  </Link>
                  <div className="vp-v1__follow-cta">
                    <FollowButton userId={item.id} initialFollowing={item.isFollowing} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="vp-v1__follow-list" aria-busy={loading} aria-live="polite" />
          )}

          {hasMore && items.length > 0 ? (
            <button
              type="button"
              className={cn("vp-v1__load-more", focusRing)}
              disabled={loading || pending}
              onClick={() =>
                startTransition(() => {
                  void load(offset, false, q);
                })
              }
            >
              Load more
            </button>
          ) : null}
        </HubPageMain>
      </div>
    </BetaAppShell>
  );
}
