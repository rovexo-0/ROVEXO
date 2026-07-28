"use client";

/**
 * Homepage Following Feed — marketplace discovery only.
 * Consumes /api/homepage/following-feed. Never creates follows.
 */

import {
  memo,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SafeImage } from "@/components/ui/SafeImage";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthOptional } from "@/features/auth/providers/AuthProvider";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import { FOLLOWING_FEED_ENGINE_V1 } from "@/lib/following-feed/following-feed-engine-v1";
import type { FollowingFeedCard, FollowingFeedPage } from "@/lib/following-feed/types";
import css from "@/features/home/components/FollowingFeedSection.module.css";

function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatRelativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}m ago`;
  if (diff < 86_400_000) return `${Math.max(1, Math.floor(diff / 3_600_000))}h ago`;
  return `${Math.max(1, Math.floor(diff / 86_400_000))}d ago`;
}

function priceDropLabel(card: FollowingFeedCard): string | null {
  if (card.eventType !== "PRICE_REDUCTION") return null;
  return "Price drop";
}

function FeedCardSaveButton({ slug }: { slug: string }) {
  const { isSaved, toggle, isPending } = useProductWatchlist(slug);
  return (
    <button
      type="button"
      className={css.action}
      disabled={isPending}
      aria-pressed={isSaved}
      aria-label={isSaved ? "Remove from saved" : "Save listing"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle();
      }}
    >
      {isSaved ? "Saved" : "Save"}
    </button>
  );
}

const FollowingFeedCardView = memo(function FollowingFeedCardView({
  card,
}: {
  card: FollowingFeedCard;
}) {
  const router = useRouter();
  const href = `/listing/${card.listingSlug}`;
  const drop = priceDropLabel(card);

  const open = () => {
    router.push(href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  const share = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== "undefined" ? `${window.location.origin}${href}` : href;
    try {
      if (navigator.share) {
        await navigator.share({ title: card.title, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // ignore cancel
    }
  };

  const headline =
    card.groupTitle ??
    (card.eventType === "SELLER_VERIFIED"
      ? `${card.seller.name} is verified`
      : card.eventType === "NEW_PUBLIC_BADGE"
        ? `${card.seller.name} earned ${card.seller.badgeLabel ?? "a badge"}`
        : card.eventType === "RELISTED_ITEM"
          ? `${card.seller.name} relisted an item`
          : card.title);

  return (
    <article
      className={css.card}
      role="link"
      tabIndex={0}
      aria-label={`${headline}. ${formatGbp(card.price)}`}
      onClick={open}
      onKeyDown={onKeyDown}
      data-following-feed-card={card.eventType}
    >
      <div className={css.media}>
        {drop ? <span className={css.badge}>{drop}</span> : null}
        <SafeImage src={card.imageUrl} alt={card.title} fill sizes="112px" />
      </div>
      <div className={css.body}>
        <div className={css.sellerRow}>
          <Avatar
            src={card.seller.avatarUrl}
            alt={card.seller.name}
            name={card.seller.name}
            size="sm"
          />
          <div className={css.sellerMeta}>
            <span className={css.sellerName}>{card.seller.name}</span>
            <div className={css.sellerBadges}>
              {card.seller.verified ? <span className={css.chip}>Verified</span> : null}
              {card.seller.badgeLabel ? (
                <span className={css.chip}>{card.seller.badgeLabel}</span>
              ) : null}
            </div>
          </div>
          <time className={css.time} dateTime={card.occurredAt}>
            {formatRelativeTime(card.occurredAt)}
          </time>
        </div>
        <h3 className={css.title}>{headline}</h3>
        <div className={css.priceRow}>
          <span className={css.price}>{formatGbp(card.price)}</span>
          {card.originalPrice != null && card.originalPrice > card.price ? (
            <span className={css.was}>{formatGbp(card.originalPrice)}</span>
          ) : null}
        </div>
        <div className={css.actions}>
          <Link
            href={href}
            className={`${css.action} ${css.actionPrimary}`}
            onClick={(e) => e.stopPropagation()}
          >
            View Listing
          </Link>
          <FeedCardSaveButton slug={card.listingSlug} />
          <button type="button" className={css.action} onClick={share}>
            Share
          </button>
        </div>
      </div>
    </article>
  );
});

async function fetchFeedPage(page: number): Promise<FollowingFeedPage> {
  const res = await fetch(`/api/homepage/following-feed?page=${page}`, {
    credentials: "same-origin",
  });
  if (!res.ok) {
    return {
      items: [],
      page,
      hasMore: false,
      followingCount: 0,
      empty: false,
      emptyMessage: null,
      error: FOLLOWING_FEED_ENGINE_V1.failSafeCopy,
    };
  }
  return (await res.json()) as FollowingFeedPage;
}

function mergeUnique(
  current: FollowingFeedCard[],
  incoming: FollowingFeedCard[],
): FollowingFeedCard[] {
  const seen = new Set(current.map((c) => c.id));
  const next = [...current];
  for (const card of incoming) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    next.push(card);
  }
  return next;
}

export const FollowingFeedSection = memo(function FollowingFeedSection() {
  const auth = useAuthOptional();
  const viewerId = auth?.profile?.id ?? null;
  const authReady = Boolean(auth?.ready);

  const [items, setItems] = useState<FollowingFeedCard[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef(1);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    if (!authReady || !viewerId) {
      return;
    }

    let cancelled = false;

    const run = async (nextPage: number, mode: "replace" | "append") => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      try {
        const data = await fetchFeedPage(nextPage);
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          if (mode === "replace") setItems([]);
          setBootstrapped(true);
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => {
            void run(nextPage, mode);
          }, 4000);
          return;
        }
        setError(null);
        setEmptyMessage(data.empty ? data.emptyMessage : null);
        setHasMore(data.hasMore);
        setPage(data.page);
        setItems((prev) =>
          mode === "replace" ? data.items : mergeUnique(prev, data.items),
        );
        setBootstrapped(true);
      } finally {
        if (!cancelled) setLoading(false);
        fetchingRef.current = false;
      }
    };

    void run(1, "replace");

    const pollId = setInterval(() => {
      void (async () => {
        const data = await fetchFeedPage(1);
        if (cancelled || data.error || data.empty) return;
        setItems((prev) => mergeUnique(data.items, prev));
      })();
    }, 45_000);

    return () => {
      cancelled = true;
      clearInterval(pollId);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [authReady, viewerId]);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current || !viewerId) return;
    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !fetchingRef.current) {
          const nextPage = pageRef.current + 1;
          void (async () => {
            if (fetchingRef.current) return;
            fetchingRef.current = true;
            setLoading(true);
            try {
              const data = await fetchFeedPage(nextPage);
              if (data.error) {
                setError(data.error);
                return;
              }
              setError(null);
              setHasMore(data.hasMore);
              setPage(data.page);
              setItems((prev) => mergeUnique(prev, data.items));
            } finally {
              setLoading(false);
              fetchingRef.current = false;
            }
          })();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, viewerId, items.length]);

  if (!authReady || !viewerId || !bootstrapped) {
    return null;
  }

  return (
    <section
      className={css.followingFeed}
      data-following-feed="v1.0"
      aria-label="Following feed"
    >
      <h2 className={css.followingFeedTitle}>Following</h2>

      {error ? (
        <div className={css.error} role="alert">
          <p>{error}</p>
          <button
            type="button"
            className={css.retry}
            onClick={() => {
              setBootstrapped(false);
              setError(null);
              // remount effect by toggling — force reload via state bump
              setPage(1);
              void fetchFeedPage(1).then((data) => {
                setBootstrapped(true);
                if (data.error) {
                  setError(data.error);
                  setItems([]);
                  return;
                }
                setError(null);
                setEmptyMessage(data.empty ? data.emptyMessage : null);
                setHasMore(data.hasMore);
                setPage(data.page);
                setItems(data.items);
              });
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!error && emptyMessage ? (
        <p className={css.empty}>{emptyMessage}</p>
      ) : null}

      {!error && items.length > 0 ? (
        <div className={css.list}>
          {items.map((card) => (
            <FollowingFeedCardView key={card.id} card={card} />
          ))}
          <div ref={sentinelRef} className={css.sentinel} aria-hidden />
        </div>
      ) : null}

      {loading ? <p className={css.loading}>Loading…</p> : null}
    </section>
  );
});
