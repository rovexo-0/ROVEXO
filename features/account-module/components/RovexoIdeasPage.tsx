"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MyAccountTemplate } from "@/features/account-canonical";
import { SafeImage } from "@/components/ui/SafeImage";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import "@/styles/rovexo/rovexo-ideas-v1.css";
import {
  ROVEXO_IDEAS_DOM,
  ROVEXO_IDEAS_EMPTY_COPY,
  ROVEXO_IDEAS_HERO,
  ROVEXO_IDEAS_MENU_TITLE,
  ROVEXO_IDEAS_SHARE_CTA,
} from "@/lib/rovexo-ideas/rovexo-ideas-v1-lock";
import {
  ROVEXO_IDEA_CATEGORIES,
  ROVEXO_IDEA_STATUS_LABELS,
  ROVEXO_IDEA_STATUS_SHORT,
  communityApprovalPercent,
  type RovexoIdeaCategory,
  type RovexoIdeaComment,
  type RovexoIdeaCommunityCard,
  type RovexoIdeasFilter,
  type RovexoIdeasStats,
  type RovexoIdeaStatus,
} from "@/lib/rovexo-ideas/types";
import { cn } from "@/lib/cn";

const FILTERS: Array<{ id: RovexoIdeasFilter; label: string }> = [
  { id: "top", label: "Top Ideas" },
  { id: "latest", label: "Latest" },
  { id: "under_review", label: "Under Review" },
  { id: "planned", label: "Planned" },
  { id: "released", label: "Released" },
  { id: "declined", label: "Declined" },
];

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconBulb() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.8c.7.5 1.1 1.2 1.2 2.2h4.6c.1-1 .5-1.7 1.2-2.2A6 6 0 0 0 12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconThumb({ down = false }: { down?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={down ? { transform: "rotate(180deg)" } : undefined}
    >
      <path
        d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h10.3a2 2 0 0 0 2-1.7l1.4-8A2 2 0 0 0 18.7 9H14ZM7 22H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconStar({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path
        d="m12 3.5 2.7 5.5 6 .9-4.4 4.2 1 6L12 17.5 6.7 20l1-6L3.3 9.9l6-.9L12 3.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatIcon({ kind }: { kind: keyof RovexoIdeasStats }) {
  const colors: Record<keyof RovexoIdeasStats, string> = {
    submitted: "#7c3aed",
    underReview: "#f97316",
    planned: "#3b82f6",
    inDevelopment: "#9333ea",
    released: "#22c55e",
  };
  return (
    <span className="rx-ideas__stat-icon" style={{ color: colors[kind] }} aria-hidden>
      {kind === "submitted" ? "💡" : null}
      {kind === "underReview" ? "⏱" : null}
      {kind === "planned" ? "📅" : null}
      {kind === "inDevelopment" ? "🚀" : null}
      {kind === "released" ? "✅" : null}
    </span>
  );
}

/**
 * Rovexo Ideas Community v1.0 — Owner mockups Empty + Community (1:1).
 * Single page · slide-down share form · no modals · no secondary routes.
 */
export function RovexoIdeasPage() {
  const router = useRouter();
  const screenshotInputId = useId();
  const [filter, setFilter] = useState<RovexoIdeasFilter>("top");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stats, setStats] = useState<RovexoIdeasStats>({
    submitted: 0,
    underReview: 0,
    planned: 0,
    inDevelopment: 0,
    released: 0,
  });
  const [ideas, setIdeas] = useState<RovexoIdeaCommunityCard[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<RovexoIdeaCategory>("Buying");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [similar, setSimilar] = useState<Array<{ id: string; subject: string; status: RovexoIdeaStatus }>>(
    [],
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  const loadFeed = useCallback(
    async (opts?: { append?: boolean; cursor?: string | null }) => {
      const append = Boolean(opts?.append);
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          filter,
          q: debouncedSearch,
          limit: "20",
        });
        if (opts?.cursor) params.set("cursor", opts.cursor);
        const [feedRes, statsRes] = await Promise.all([
          fetch(`/api/account/ideas?${params.toString()}`, { cache: "no-store" }),
          append
            ? Promise.resolve(null)
            : fetch("/api/account/ideas?stats=1", { cache: "no-store" }),
        ]);
        const feedJson = (await feedRes.json()) as {
          ideas?: RovexoIdeaCommunityCard[];
          nextCursor?: string | null;
          error?: string;
        };
        if (!feedRes.ok) throw new Error(feedJson.error ?? "Unable to load ideas.");
        setIdeas((prev) => (append ? [...prev, ...(feedJson.ideas ?? [])] : feedJson.ideas ?? []));
        setCursor(feedJson.nextCursor ?? null);
        if (statsRes) {
          const statsJson = (await statsRes.json()) as { stats?: RovexoIdeasStats };
          if (statsJson.stats) setStats(statsJson.stats);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load ideas.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, filter],
  );

  useEffect(() => {
    void (async () => {
      await loadFeed();
    })();
  }, [loadFeed]);

  useEffect(() => {
    if (subject.trim().length < 3) {
      queueMicrotask(() => setSimilar([]));
      return;
    }
    const t = window.setTimeout(() => {
      void (async () => {
        const res = await fetch(`/api/account/ideas?similar=${encodeURIComponent(subject.trim())}`);
        const json = (await res.json()) as {
          ideas?: Array<{ id: string; subject: string; status: RovexoIdeaStatus }>;
        };
        setSimilar(json.ideas ?? []);
      })();
    }, 320);
    return () => window.clearTimeout(t);
  }, [subject]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && cursor && !loadingMore) {
          void loadFeed({ append: true, cursor });
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loadFeed, loadingMore]);

  /** Empty State ONLY when zero visible ideas. ideas.length > 0 → list only (no mascot/copy). */
  const isEmptyState = !loading && ideas.length === 0;
  const isCommunityState = ideas.length > 0;

  const onVote = (ideaId: string, vote: "like" | "dislike") => {
    startTransition(async () => {
      const current = ideas.find((i) => i.id === ideaId);
      if (!current) return;
      const nextVote =
        current.myVote === vote ? "none" : vote;
      const res = await fetch(`/api/account/ideas/${ideaId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: nextVote }),
      });
      const json = (await res.json()) as {
        likeCount?: number;
        dislikeCount?: number;
        myVote?: "like" | "dislike" | null;
        error?: string;
      };
      if (!res.ok) return;
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === ideaId
            ? {
                ...idea,
                likeCount: json.likeCount ?? idea.likeCount,
                dislikeCount: json.dislikeCount ?? idea.dislikeCount,
                myVote: json.myVote ?? null,
                communityApproval: communityApprovalPercent(
                  json.likeCount ?? idea.likeCount,
                  json.dislikeCount ?? idea.dislikeCount,
                ),
              }
            : idea,
        ),
      );
    });
  };

  const onFollow = (ideaId: string, follow: boolean) => {
    startTransition(async () => {
      const res = await fetch(`/api/account/ideas/${ideaId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow }),
      });
      const json = (await res.json()) as {
        followCount?: number;
        following?: boolean;
      };
      if (!res.ok) return;
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === ideaId
            ? {
                ...idea,
                following: Boolean(json.following),
                followCount: json.followCount ?? idea.followCount,
              }
            : idea,
        ),
      );
    });
  };

  const onShare = async (idea: RovexoIdeaCommunityCard) => {
    const url = `${window.location.origin}/account/ideas?idea=${idea.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: idea.subject, text: idea.body.slice(0, 120), url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // user cancelled share
    }
  };

  const onComment = (ideaId: string) => {
    const text = (commentDrafts[ideaId] ?? "").trim();
    if (!text) return;
    startTransition(async () => {
      const res = await fetch(`/api/account/ideas/${ideaId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const json = (await res.json()) as { comment?: RovexoIdeaComment };
      if (!res.ok || !json.comment) return;
      setCommentDrafts((prev) => ({ ...prev, [ideaId]: "" }));
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === ideaId
            ? {
                ...idea,
                commentCount: idea.commentCount + 1,
                comments: [json.comment!, ...idea.comments].slice(0, 5),
              }
            : idea,
        ),
      );
    });
  };

  const onSubmitIdea = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("subject", subject);
      formData.set("body", body);
      formData.set("category", category);
      if (screenshotFile) formData.set("screenshot", screenshotFile);
      const res = await fetch("/api/account/ideas", { method: "POST", body: formData });
      const json = (await res.json()) as {
        error?: string;
        idea?: RovexoIdeaCommunityCard;
        success?: boolean;
      };
      if (!res.ok) {
        setFormError(json.error ?? "Unable to share your idea.");
        return;
      }
      setSubject("");
      setBody("");
      setCategory("Buying");
      setScreenshotFile(null);
      setScreenshotName(null);
      setSimilar([]);
      setSheetOpen(false);
      setFilter("latest");
      setSearch("");
      // Instant Empty → Community (optimistic card → no empty flicker / layout jump)
      if (json.idea) {
        setIdeas((prev) =>
          prev.some((item) => item.id === json.idea!.id) ? prev : [json.idea!, ...prev],
        );
      }
      setStats((prev) => ({ ...prev, submitted: Math.max(prev.submitted, 0) + 1 }));
      await loadFeed();
    });
  };

  const statsItems = useMemo(
    () =>
      [
        { key: "submitted" as const, label: "Ideas Submitted", value: stats.submitted },
        { key: "underReview" as const, label: "Under Review", value: stats.underReview },
        { key: "planned" as const, label: "Planned", value: stats.planned },
        { key: "inDevelopment" as const, label: "In Development", value: stats.inDevelopment },
        { key: "released" as const, label: "Released", value: stats.released },
      ] as const,
    [stats],
  );

  return (
    <MyAccountTemplate
      surface="ideas"
      title={ROVEXO_IDEAS_MENU_TITLE}
      backHref="/account"
      hideBack
      showBottomNav
      bottomNavTab="account"
      contentClassName="rx-ideas-shell"
    >
      <div className="rx-ideas" data-rovexo-ideas-version={ROVEXO_IDEAS_DOM} data-full-width-surface="ideas">
        <section className="rx-ideas__hero" aria-label="Rovexo Ideas hero">
          <button
            type="button"
            className="rx-ideas__hero-close"
            aria-label="Close"
            onClick={() => router.push("/account")}
          >
            <IconClose />
          </button>
          <div className="rx-ideas__hero-grid">
            <div className="rx-ideas__hero-copy">
              <h1 className="rx-ideas__title">
                {ROVEXO_IDEAS_HERO.titlePrefix}{" "}
                <span className="rx-ideas__title-accent">{ROVEXO_IDEAS_HERO.titleAccent}</span>
              </h1>
              <p className="rx-ideas__subtitle">{ROVEXO_IDEAS_HERO.subtitle}</p>
              <button
                type="button"
                className="rx-ideas__share-cta"
                onClick={() => setSheetOpen((v) => !v)}
                aria-expanded={sheetOpen}
              >
                <IconBulb />
                {ROVEXO_IDEAS_SHARE_CTA}
              </button>
            </div>
            <div className="rx-ideas__hero-bear">
              <SafeImage
                src={ROVEXO_IDEAS_HERO.bearSrc}
                alt="RX Bear with glowing idea"
                width={180}
                height={200}
                fallback="placeholder"
              />
            </div>
          </div>
        </section>

        <div className="rx-ideas__stats" role="group" aria-label="Idea statistics">
          {statsItems.map((item) => (
            <div key={item.key} className="rx-ideas__stat">
              <StatIcon kind={item.key} />
              <div className="rx-ideas__stat-value">{item.value}</div>
              <div className="rx-ideas__stat-label">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="rx-ideas__filters-wrap">
          <div className="rx-ideas__filters" role="tablist" aria-label="Idea filters">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={cn("rx-ideas__filter", filter === item.id && "rx-ideas__filter--active")}
                onClick={() => setFilter(item.id)}
              >
                {item.id === "top" ? "🔥 " : null}
                {item.label}
              </button>
            ))}
          </div>
          <span className="rx-ideas__filter-tool" aria-hidden>
            ⏷
          </span>
        </div>

        {isCommunityState ? (
          <div className="rx-ideas__search rx-ideas__fade-in" key="ideas-search">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ideas"
              aria-label="Search ideas"
            />
          </div>
        ) : null}

        <div className={cn("rx-ideas__sheet", sheetOpen && "rx-ideas__sheet--open")} aria-hidden={!sheetOpen}>
          <form className="rx-ideas__sheet-inner" onSubmit={onSubmitIdea}>
            <div className="rx-ideas__field">
              <label htmlFor="rx-idea-title">Title</label>
              <input
                id="rx-idea-title"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                required
                disabled={isPending}
              />
            </div>
            {similar.length > 0 ? (
              <div className="rx-ideas__similar" role="status">
                Similar ideas — avoid duplicates:
                {similar.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setExpandedId(item.id);
                      setSheetOpen(false);
                    }}
                  >
                    {item.subject}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="rx-ideas__field">
              <label htmlFor="rx-idea-category">Category</label>
              <select
                id="rx-idea-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as RovexoIdeaCategory)}
                disabled={isPending}
              >
                {ROVEXO_IDEA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="rx-ideas__field">
              <label htmlFor="rx-idea-body">Description</label>
              <textarea
                id="rx-idea-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={5000}
                required
                disabled={isPending}
              />
            </div>
            <div className="rx-ideas__field">
              <label htmlFor={screenshotInputId}>Screenshot (optional)</label>
              <NativeImageFileInput
                id={screenshotInputId}
                disabled={isPending}
                onFilesSelected={(files) => {
                  const file = files[0] ?? null;
                  setScreenshotFile(file);
                  setScreenshotName(file?.name ?? null);
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {screenshotName ?? "No file chosen"}
              </span>
            </div>
            {formError ? <p className="rx-ideas__error">{formError}</p> : null}
            <button type="submit" className="rx-ideas__submit" disabled={isPending}>
              {isPending ? "Sharing…" : "Submit"}
            </button>
          </form>
        </div>

        {error ? <p className="rx-ideas__error">{error}</p> : null}

        {isEmptyState ? (
          <section className="rx-ideas__empty rx-ideas__fade-in" aria-label="Empty ideas state">
            <SafeImage
              className="rx-ideas__empty-bear"
              src={ROVEXO_IDEAS_HERO.emptyBearSrc}
              alt="RX Bear thinking"
              width={220}
              height={220}
              fallback="placeholder"
            />
            <h2 className="rx-ideas__empty-title">{ROVEXO_IDEAS_EMPTY_COPY.title}</h2>
            <p className="rx-ideas__empty-body">{ROVEXO_IDEAS_EMPTY_COPY.body}</p>
          </section>
        ) : null}

        {isCommunityState ? (
          <div className="rx-ideas__list rx-ideas__fade-in" role="feed" aria-label="Community ideas">
            {ideas.map((idea, index) => {
              const expanded = expandedId === idea.id;
              return (
                <article
                  key={idea.id}
                  className={cn("rx-ideas__card", expanded && "is-expanded")}
                  data-expanded={expanded ? "true" : "false"}
                >
                  <div
                    className="rx-ideas__card-collapsed"
                    role="button"
                    tabIndex={0}
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : idea.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedId(expanded ? null : idea.id);
                      }
                    }}
                  >
                    <div className="rx-ideas__vote-col" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={cn(
                          "rx-ideas__vote-btn rx-ideas__vote-btn--like",
                          idea.myVote === "like" && "is-active",
                        )}
                        aria-label="Like"
                        onClick={() => onVote(idea.id, "like")}
                      >
                        <IconThumb />
                        <strong>{idea.likeCount}</strong>
                        <span>Like</span>
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "rx-ideas__vote-btn rx-ideas__vote-btn--dislike",
                          idea.myVote === "dislike" && "is-active",
                        )}
                        aria-label="Dislike"
                        onClick={() => onVote(idea.id, "dislike")}
                      >
                        <IconThumb down />
                        <strong>{idea.dislikeCount}</strong>
                        <span>Dislike</span>
                      </button>
                    </div>

                    <div className="rx-ideas__card-main">
                      <div className="rx-ideas__card-head">
                        <span className="rx-ideas__rank">{index + 1}</span>
                        <h3 className="rx-ideas__card-title">{idea.subject}</h3>
                        <span className={cn("rx-ideas__badge", `rx-ideas__badge--${idea.status}`)}>
                          {expanded
                            ? ROVEXO_IDEA_STATUS_LABELS[idea.status]
                            : ROVEXO_IDEA_STATUS_SHORT[idea.status]}
                        </span>
                      </div>
                      <div className="rx-ideas__meta">
                        {idea.userAvatarUrl ? (
                          <SafeImage
                            src={idea.userAvatarUrl}
                            alt=""
                            width={18}
                            height={18}
                            fallback="hide"
                          />
                        ) : (
                          <span
                            aria-hidden
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 999,
                              background: "#ede9fe",
                              display: "inline-block",
                            }}
                          />
                        )}
                        <span>{idea.userName ?? "Member"}</span>
                        <span>·</span>
                        <span>{formatRelative(idea.createdAt)}</span>
                        <span className="rx-ideas__tag">{idea.category}</span>
                      </div>
                      <div className="rx-ideas__card-actions">
                        <span>💬 {idea.commentCount} Comments</span>
                      </div>
                    </div>

                    <div className="rx-ideas__card-side" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={cn("rx-ideas__follow", idea.following && "is-following")}
                        onClick={() => onFollow(idea.id, !idea.following)}
                        aria-pressed={idea.following}
                      >
                        <IconStar filled={idea.following} />
                        {idea.following ? "Following" : "Follow"}
                      </button>
                      <span className="rx-ideas__chevron" aria-hidden>
                        ▾
                      </span>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="rx-ideas__expanded">
                      <p className="rx-ideas__description">{idea.body}</p>
                      <div className="rx-ideas__score">
                        <div className="rx-ideas__score-ring">{idea.communityApproval}%</div>
                        <div className="rx-ideas__score-label">Community Approval</div>
                      </div>
                      {idea.followCount > 0 ? (
                        <p className="rx-ideas__followers">
                          +{idea.followCount} Following this idea
                        </p>
                      ) : null}

                      <div className="rx-ideas__timeline">
                        <h4>Updates from Rovexo Team</h4>
                        {(idea.updates.length > 0
                          ? idea.updates
                          : [
                              {
                                id: "seed",
                                ideaId: idea.id,
                                status: idea.status,
                                message: ROVEXO_IDEA_STATUS_LABELS[idea.status],
                                createdAt: idea.updatedAt,
                              },
                            ]
                        ).map((update) => (
                          <div key={update.id} className="rx-ideas__timeline-item">
                            <strong>{ROVEXO_IDEA_STATUS_LABELS[update.status]}</strong>
                            <p>
                              {update.message} · {formatRelative(update.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="rx-ideas__expanded-actions">
                        <button type="button" className="rx-ideas__chip" onClick={() => onShare(idea)}>
                          Share
                        </button>
                        <button
                          type="button"
                          className="rx-ideas__chip"
                          onClick={() => setExpandedId(null)}
                        >
                          Collapse
                        </button>
                      </div>

                      <div className="rx-ideas__comments">
                        <h4>Latest Comments</h4>
                        {idea.comments.map((comment) => (
                          <div key={comment.id} className="rx-ideas__comment">
                            {comment.userAvatarUrl ? (
                              <SafeImage
                                src={comment.userAvatarUrl}
                                alt=""
                                width={28}
                                height={28}
                                fallback="hide"
                              />
                            ) : (
                              <span
                                aria-hidden
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 999,
                                  background: "#ede9fe",
                                }}
                              />
                            )}
                            <div className="rx-ideas__comment-body">
                              <strong>{comment.userName ?? "Member"}</strong>
                              <p>{comment.body}</p>
                              <div className="rx-ideas__comment-meta">
                                <span>{formatRelative(comment.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="rx-ideas__composer">
                          <input
                            value={commentDrafts[idea.id] ?? ""}
                            onChange={(e) =>
                              setCommentDrafts((prev) => ({ ...prev, [idea.id]: e.target.value }))
                            }
                            placeholder="Write a comment"
                            aria-label="Write a comment"
                            maxLength={2000}
                          />
                          <button type="button" onClick={() => onComment(idea.id)} disabled={isPending}>
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
            <div ref={sentinelRef} className="rx-ideas__sentinel" aria-hidden />
            {loadingMore ? <p className="rx-ideas__loading">Loading more…</p> : null}
          </div>
        ) : null}
      </div>
    </MyAccountTemplate>
  );
}
