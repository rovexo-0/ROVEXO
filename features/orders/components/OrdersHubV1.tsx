"use client";

import Link from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SVGProps,
  type TouchEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BellLineIcon,
  ChatLineIcon,
  ChevronRightLineIcon,
  DocumentLineIcon,
  PoundLineIcon,
  StarLineIcon,
  TruckLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import { triggerCommerceHaptic } from "@/lib/mobile-ui/haptic";
import {
  buildBoughtSummary,
  buildSoldSummary,
  countOrdersByFilter,
  matchesOrdersHubStatusFilter,
  sortOrdersHubNewest,
  type OrdersHubStatusFilter,
  type OrdersHubSummaryCard,
} from "@/lib/orders/hub-summary";
import { formatOrdersHubDate, getOrdersHubBadge } from "@/lib/orders/hub-status";
import {
  getOrdersHubTimeline,
  getOrdersHubTimelineProgress,
} from "@/lib/orders/hub-timeline";
import type { Order } from "@/lib/orders/types";
import { formatCurrency } from "@/lib/wallet/utils";
import "@/styles/rovexo/orders-hub-v1.css";

type OrderTab = "sold" | "bought";

export type OrdersHubV1Props = {
  boughtOrders: Order[];
  soldOrders: Order[];
  unreadNotifications?: number;
};

const PAGE_SIZE = 16;
const CARD_BLOCK = 233; // 215 card + 18 gap
const SWIPE_MAX = 168;
const SWIPE_THRESHOLD = 56;
const LONG_PRESS_MS = 480;

const TABS: { id: OrderTab; label: string }[] = [
  { id: "sold", label: "Sold" },
  { id: "bought", label: "Bought" },
];

const STATUS_FILTERS: { id: OrdersHubStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "processing", label: "Processing" },
  { id: "shipping", label: "Shipping" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

type IconProps = SVGProps<SVGSVGElement>;

function SummaryGlyph({ tone }: { tone: OrdersHubSummaryCard["tone"] }) {
  const className = "orders-v2__stat-svg";
  if (tone === "sales") return <PoundLineIcon className={className} />;
  if (tone === "pending") return <WalletLineIcon className={className} />;
  if (tone === "orders") return <TruckLineIcon className={className} />;
  return <StarLineIcon className={className} />;
}

function PackageEmptyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden {...props}>
      <path
        d="M22 38 60 18l38 20v44L60 102 22 82V38Z"
        fill="#F3F0FF"
        stroke="#7C3AED"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M60 18v84M22 38l38 20 38-20" stroke="#7C3AED" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function partyInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function orderDetailHref(order: Order, tab: OrderTab): string {
  return tab === "sold" ? `/seller/orders/${order.id}` : `/orders/${order.id}`;
}

function formatStepTime(iso?: string): string {
  if (!iso) return "No timestamp yet";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function OrdersTimeline({ order }: { order: Order }) {
  const steps = getOrdersHubTimeline(order);
  const progress = getOrdersHubTimelineProgress(order);
  const [activeTip, setActiveTip] = useState<string | null>(null);

  return (
    <div className="orders-v2__timeline">
      <div className="orders-v2__timeline-track" aria-hidden>
        <span
          className={cn(
            "orders-v2__timeline-fill",
            order.status === "cancelled" && "orders-v2__timeline-fill--cancelled",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="orders-v2__timeline-steps">
        {steps.map((step) => (
          <li key={step.id} className={cn("orders-v2__timeline-step", `is-${step.state}`)}>
            <button
              type="button"
              className="orders-v2__timeline-hit"
              aria-label={`${step.label}${step.timestamp ? `, ${formatStepTime(step.timestamp)}` : ""}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setActiveTip((prev) => (prev === step.id ? null : step.id));
                triggerCommerceHaptic();
              }}
            >
              <span className="orders-v2__timeline-dot" aria-hidden />
              <span className="orders-v2__timeline-label">{step.label}</span>
            </button>
            {activeTip === step.id ? (
              <span className="orders-v2__timeline-tip" role="status">
                {formatStepTime(step.timestamp)}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

type OrderCardProps = {
  order: Order;
  tab: OrderTab;
  archived: boolean;
  onArchive: (id: string) => void;
};

const OrdersHubCard = memo(function OrdersHubCard({
  order,
  tab,
  archived,
  onArchive,
}: OrderCardProps) {
  const router = useRouter();
  const badge = getOrdersHubBadge(order);
  const party = tab === "sold" ? order.buyer : order.seller;
  const href = orderDetailHref(order, tab);
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const startX = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);
  const currentOffset = useRef(0);
  const longPressTimer = useRef<number | null>(null);

  const resetSwipe = useCallback(() => {
    currentOffset.current = 0;
    setAnimating(!prefersReducedMotion());
    setOffset(0);
    window.setTimeout(() => setAnimating(false), 200);
  }, []);

  const clearLongPress = () => {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const openDetails = () => {
    router.push(href);
  };

  const goMessages = () => {
    resetSwipe();
    router.push(`/messages?orderId=${encodeURIComponent(order.id)}`);
  };

  const goTrack = () => {
    resetSwipe();
    router.push(tab === "bought" ? `/orders/${order.id}/tracking` : href);
  };

  const goRefund = () => {
    resetSwipe();
    router.push(`${href}?action=refund`);
  };

  const goLabel = () => {
    resetSwipe();
    router.push(`${href}?action=print-label`);
  };

  const archive = () => {
    onArchive(order.id);
    triggerCommerceHaptic();
    resetSwipe();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragging.current = true;
    moved.current = false;
    startX.current = event.clientX - currentOffset.current;
    event.currentTarget.setPointerCapture(event.pointerId);
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      setMenuOpen(true);
      triggerCommerceHaptic();
      dragging.current = false;
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const next = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, event.clientX - startX.current));
    if (Math.abs(next) > 8) {
      moved.current = true;
      clearLongPress();
    }
    currentOffset.current = next;
    setOffset(next);
  };

  const onPointerUp = () => {
    clearLongPress();
    if (!dragging.current) return;
    dragging.current = false;

    if (currentOffset.current <= -SWIPE_THRESHOLD) {
      setAnimating(true);
      currentOffset.current = -SWIPE_MAX;
      setOffset(-SWIPE_MAX);
      return;
    }
    if (currentOffset.current >= SWIPE_THRESHOLD) {
      setAnimating(true);
      currentOffset.current = SWIPE_MAX * 0.55;
      setOffset(SWIPE_MAX * 0.55);
      return;
    }
    if (!moved.current && !menuOpen) {
      openDetails();
      return;
    }
    resetSwipe();
  };

  if (archived) return null;

  return (
    <div className="orders-v2__swipe">
      <div className="orders-v2__swipe-left" aria-hidden>
        <button type="button" className="orders-v2__swipe-action" onClick={goMessages}>
          <ChatLineIcon />
          <span>Message</span>
        </button>
        <button type="button" className="orders-v2__swipe-action" onClick={goTrack}>
          <TruckLineIcon />
          <span>Track</span>
        </button>
        <button type="button" className="orders-v2__swipe-action" onClick={goRefund}>
          <WalletLineIcon />
          <span>Refund</span>
        </button>
        {tab === "sold" ? (
          <button type="button" className="orders-v2__swipe-action" onClick={goLabel}>
            <DocumentLineIcon />
            <span>Label</span>
          </button>
        ) : null}
      </div>
      <div className="orders-v2__swipe-right" aria-hidden>
        <button type="button" className="orders-v2__swipe-action orders-v2__swipe-action--archive" onClick={archive}>
          Archive
        </button>
      </div>

      <div
        className={cn("orders-v2__swipe-front", animating && "orders-v2__swipe-front--anim")}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          clearLongPress();
          dragging.current = false;
          resetSwipe();
        }}
      >
        <article className="orders-v2__card" data-order-id={order.id}>
          <div className="orders-v2__card-main">
            <ProductRowImage
              src={order.product.imageUrl}
              alt={order.product.title}
              containerClassName="orders-v2__card-image"
              sizes="110px"
            />
            <div className="orders-v2__card-info">
              <div className="orders-v2__card-top">
                <div className="orders-v2__card-copy">
                  <p className="orders-v2__card-id">Order {order.orderNumber}</p>
                  <p className="orders-v2__card-title">{order.product.title}</p>
                  <p className="orders-v2__card-variant">{order.product.condition}</p>
                  <div className="orders-v2__card-party">
                    <span className="orders-v2__avatar" aria-hidden>
                      {partyInitials(party.name)}
                    </span>
                    <span className="orders-v2__card-party-name">{party.name}</span>
                  </div>
                </div>
                <div className="orders-v2__card-right">
                  <p className="orders-v2__card-price">{formatCurrency(order.totals.total)}</p>
                  <span className={cn("orders-v2__badge", `orders-v2__badge--${badge.tone}`)}>
                    {badge.label}
                  </span>
                  <ChevronRightLineIcon className="orders-v2__card-chevron" />
                </div>
              </div>
              <p className="orders-v2__card-date">{formatOrdersHubDate(order.createdAt)}</p>
            </div>
          </div>
          <OrdersTimeline order={order} />
        </article>
      </div>

      {menuOpen ? (
        <div className="orders-v2__quick" role="menu" aria-label="Order quick menu">
          <button type="button" role="menuitem" onClick={goMessages}>
            Message
          </button>
          <button type="button" role="menuitem" onClick={goTrack}>
            Track
          </button>
          <button type="button" role="menuitem" onClick={goRefund}>
            Refund
          </button>
          {tab === "sold" ? (
            <button type="button" role="menuitem" onClick={goLabel}>
              Print Label
            </button>
          ) : null}
          <button type="button" role="menuitem" onClick={archive}>
            Archive
          </button>
          <button type="button" role="menuitem" className="orders-v2__quick-cancel" onClick={() => setMenuOpen(false)}>
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
});

function StatCard({
  card,
  onFilter,
}: {
  card: OrdersHubSummaryCard;
  onFilter: (filter: OrdersHubStatusFilter) => void;
}) {
  const body = (
    <>
      <span className={cn("orders-v2__stat-icon", `orders-v2__stat-icon--${card.tone}`)}>
        <SummaryGlyph tone={card.tone} />
      </span>
      <p className="orders-v2__stat-title">{card.title}</p>
      <p className="orders-v2__stat-value">{card.value}</p>
      <p className="orders-v2__stat-sub">{card.subtitle}</p>
    </>
  );

  if (card.href) {
    return (
      <Link href={card.href} className="orders-v2__stat-card">
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="orders-v2__stat-card"
      onClick={() => {
        if (card.filter) onFilter(card.filter);
        triggerCommerceHaptic();
      }}
    >
      {body}
    </button>
  );
}

function OrdersEmptyState() {
  return (
    <div className="orders-v2__empty" data-orders-empty="v1">
      <PackageEmptyIcon className="orders-v2__empty-img" />
      <h2 className="orders-v2__empty-title">No orders yet</h2>
      <p className="orders-v2__empty-body">
        Once someone buys your item,
        <br />
        your orders will appear here.
      </p>
      <div className="orders-v2__empty-actions">
        <Link href="/sell" className="orders-v2__empty-btn orders-v2__empty-btn--primary">
          Sell an Item
        </Link>
        <Link href="/" className="orders-v2__empty-btn orders-v2__empty-btn--secondary">
          Browse Marketplace
        </Link>
      </div>
    </div>
  );
}

export function OrdersHubSkeleton() {
  return (
    <div className="orders-v2 orders-v2--skeleton" aria-busy="true" aria-label="Loading orders">
      <div className="orders-v2__tabs">
        <div className="orders-v2__skel orders-v2__skel--tab" />
        <div className="orders-v2__skel orders-v2__skel--tab" />
      </div>
      <div className="orders-v2__stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="orders-v2__skel orders-v2__skel--stat" />
        ))}
      </div>
      <div className="orders-v2__chips">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="orders-v2__skel orders-v2__skel--chip" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="orders-v2__skel orders-v2__skel--card" />
      ))}
    </div>
  );
}

export function OrdersHubV1({
  boughtOrders,
  soldOrders,
  unreadNotifications = 0,
}: OrdersHubV1Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab: OrderTab = searchParams.get("tab") === "bought" ? "bought" : "sold";
  const [statusFilter, setStatusFilter] = useState<OrdersHubStatusFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => new Set());
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const pullStartY = useRef<number | null>(null);
  const listTopRef = useRef<HTMLDivElement | null>(null);

  const sourceOrders = activeTab === "sold" ? soldOrders : boughtOrders;

  const filteredOrders = useMemo(() => {
    const matched = sourceOrders
      .filter((order) => !archivedIds.has(order.id))
      .filter((order) => matchesOrdersHubStatusFilter(order, statusFilter));
    return sortOrdersHubNewest(matched);
  }, [sourceOrders, statusFilter, archivedIds]);

  const chipCounts = useMemo(() => countOrdersByFilter(sourceOrders), [sourceOrders]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, statusFilter]);

  // Windowed render: keep a buffer around the viewport for “virtualized / infinite ready”.
  useEffect(() => {
    const onScroll = () => {
      const top = listTopRef.current?.offsetTop ?? 0;
      const start = Math.max(0, Math.floor((window.scrollY - top) / CARD_BLOCK) - 2);
      const end = start + Math.ceil(window.innerHeight / CARD_BLOCK) + 6;
      setVisibleCount((prev) => Math.max(prev, Math.min(filteredOrders.length, end)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [filteredOrders.length]);

  const visibleOrders = filteredOrders.slice(0, visibleCount);
  const hasMore = visibleCount < filteredOrders.length;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredOrders.length));
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, filteredOrders.length, visibleOrders.length]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [router]);

  const summary = useMemo(
    () => (activeTab === "sold" ? buildSoldSummary(soldOrders) : buildBoughtSummary(boughtOrders)),
    [activeTab, soldOrders, boughtOrders],
  );

  const switchTab = (tab: OrderTab) => {
    setStatusFilter("all");
    triggerCommerceHaptic();
    router.push(tab === "sold" ? "/orders" : "/orders?tab=bought");
  };

  const onTouchStart = useCallback((event: TouchEvent) => {
    if (typeof window !== "undefined" && window.scrollY <= 0) {
      pullStartY.current = event.touches[0]?.clientY ?? null;
    } else {
      pullStartY.current = null;
    }
  }, []);

  const onTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (pullStartY.current == null) return;
      const endY = event.changedTouches[0]?.clientY ?? 0;
      if (endY - pullStartY.current > 72) router.refresh();
      pullStartY.current = null;
    },
    [router],
  );

  const archiveOrder = useCallback((id: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const notificationAction: ReactNode = (
    <Link
      href="/notifications"
      aria-label={
        unreadNotifications > 0
          ? `Notifications, ${unreadNotifications} unread`
          : "Notifications"
      }
      className="orders-v2__notify"
    >
      <BellLineIcon className="orders-v2__notify-icon" />
      <span
        className={cn(
          "orders-v2__notify-dot",
          unreadNotifications <= 0 && "orders-v2__notify-dot--hidden",
        )}
        aria-hidden
      />
    </Link>
  );

  return (
    <AccountCanonicalShell
      title="Orders"
      showHeaderTitle
      backHref="/account"
      rightAction={notificationAction}
    >
      <div
        className="orders-v2"
        data-orders-hub-version="v1.0"
        data-orders-ui="v1.0-engineering-spec"
        data-orders-freeze="pending-visual-qa"
        data-orders-sections="header,tabs,stats,chips,list"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="orders-v2__tabs" role="tablist" aria-label="Order type">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={cn("orders-v2__tab", activeTab === tab.id && "orders-v2__tab--active")}
              onClick={() => switchTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="orders-v2__stats" aria-label="Orders statistics">
          {summary.map((card) => (
            <StatCard key={card.id} card={card} onFilter={setStatusFilter} />
          ))}
        </section>

        <div className="orders-v2__chips" role="group" aria-label="Order status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={cn(
                "orders-v2__chip",
                statusFilter === filter.id && "orders-v2__chip--active",
              )}
              aria-pressed={statusFilter === filter.id}
              onClick={() => {
                setStatusFilter(filter.id);
                triggerCommerceHaptic();
              }}
            >
              <span className="orders-v2__chip-label">{filter.label}</span>
              <span className="orders-v2__chip-count">{chipCounts[filter.id]}</span>
            </button>
          ))}
        </div>

        <div ref={listTopRef} />

        {visibleOrders.length === 0 ? (
          <OrdersEmptyState />
        ) : (
          <ul className="orders-v2__list">
            {visibleOrders.map((order) => (
              <li key={order.id}>
                <OrdersHubCard
                  order={order}
                  tab={activeTab}
                  archived={archivedIds.has(order.id)}
                  onArchive={archiveOrder}
                />
              </li>
            ))}
          </ul>
        )}

        {hasMore ? <div ref={loadMoreRef} className="orders-v2__sentinel" aria-hidden /> : null}
      </div>
    </AccountCanonicalShell>
  );
}
