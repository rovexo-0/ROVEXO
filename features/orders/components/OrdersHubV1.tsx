"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
  type TouchEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BellLineIcon,
  ChevronRightLineIcon,
  PoundLineIcon,
  StarLineIcon,
  TruckLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { PremiumEmptyStateImage } from "@/components/ui/PremiumEmptyStateImage";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import {
  buildBoughtSummary,
  buildSoldSummary,
  matchesOrdersHubStatusFilter,
  searchOrdersHub,
  sortOrdersHub,
  type OrdersHubSort,
  type OrdersHubStatusFilter,
  type OrdersHubSummaryCard,
} from "@/lib/orders/hub-summary";
import { formatOrdersHubDate, getOrdersHubBadge } from "@/lib/orders/hub-status";
import { getOrdersHubTimeline } from "@/lib/orders/hub-timeline";
import type { Order } from "@/lib/orders/types";
import { formatCurrency } from "@/lib/wallet/utils";
import "@/styles/rovexo/orders-hub-v1.css";

type OrderTab = "sold" | "bought";

type OrdersHubV1Props = {
  boughtOrders: Order[];
  soldOrders: Order[];
  unreadNotifications?: number;
};

const PAGE_SIZE = 12;

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

const SORT_OPTIONS: { id: OrdersHubSort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "highest_value", label: "Highest Value" },
  { id: "lowest_value", label: "Lowest Value" },
];

type IconProps = SVGProps<SVGSVGElement>;

function OrdersBagIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  );
}

function SummaryIcon({ tone }: { tone: OrdersHubSummaryCard["tone"] }) {
  if (tone === "sales") return <PoundLineIcon className="orders-v2__summary-svg" />;
  if (tone === "pending") return <WalletLineIcon className="orders-v2__summary-svg" />;
  if (tone === "orders") return <TruckLineIcon className="orders-v2__summary-svg" />;
  return <StarLineIcon className="orders-v2__summary-svg" />;
}

function partyInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function orderDetailHref(order: Order, tab: OrderTab): string {
  return tab === "sold" ? `/seller/orders/${order.id}` : `/orders/${order.id}`;
}

function OrdersTimeline({ order }: { order: Order }) {
  const steps = getOrdersHubTimeline(order);
  return (
    <ol className="orders-v2__timeline" aria-label="Order progress">
      {steps.map((step, index) => (
        <li key={step.id} className={cn("orders-v2__timeline-step", `orders-v2__timeline-step--${step.state}`)}>
          {index > 0 ? (
            <span
              className={cn(
                "orders-v2__timeline-line",
                (step.state === "complete" || step.state === "current") && "orders-v2__timeline-line--active",
                step.state === "cancelled" && "orders-v2__timeline-line--cancelled",
              )}
              aria-hidden
            />
          ) : null}
          <span className="orders-v2__timeline-node" aria-hidden />
          <span className="orders-v2__timeline-label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

function OrdersHubCard({ order, tab }: { order: Order; tab: OrderTab }) {
  const badge = getOrdersHubBadge(order);
  const party = tab === "sold" ? order.buyer : order.seller;
  const partyLabel = tab === "sold" ? "Buyer" : "Seller";

  return (
    <Link href={orderDetailHref(order, tab)} className="orders-v2__card">
      <div className="orders-v2__card-main">
        <ProductRowImage
          src={order.product.imageUrl}
          alt={order.product.title}
          containerClassName="orders-v2__card-image"
          sizes="96px"
        />
        <div className="orders-v2__card-info">
          <div className="orders-v2__card-top">
            <p className="orders-v2__card-id">Order {order.orderNumber}</p>
            <p className="orders-v2__card-price">{formatCurrency(order.totals.total)}</p>
          </div>
          <p className="orders-v2__card-title">{order.product.title}</p>
          <p className="orders-v2__card-variant">{order.product.condition}</p>
          <div className="orders-v2__card-meta">
            <span className="orders-v2__card-party" title={`${partyLabel}: ${party.name}`}>
              <span className="orders-v2__avatar" aria-hidden>
                {partyInitials(party.name) || "?"}
              </span>
              <span className="orders-v2__card-party-name">{party.name}</span>
            </span>
            <span className={cn("orders-v2__badge", `orders-v2__badge--${badge.tone}`)}>{badge.label}</span>
          </div>
          <div className="orders-v2__card-foot">
            <p className="orders-v2__card-date">{formatOrdersHubDate(order.createdAt)}</p>
            <ChevronRightLineIcon className="orders-v2__card-chevron" />
          </div>
        </div>
      </div>
      <OrdersTimeline order={order} />
    </Link>
  );
}

function SummaryCard({
  card,
  onFilter,
}: {
  card: OrdersHubSummaryCard;
  onFilter: (filter: OrdersHubStatusFilter) => void;
}) {
  const content = (
    <>
      <div className="orders-v2__summary-head">
        <span className={cn("orders-v2__summary-icon", `orders-v2__summary-icon--${card.tone}`)}>
          <SummaryIcon tone={card.tone} />
        </span>
        <p className="orders-v2__summary-title">{card.title}</p>
      </div>
      <p className="orders-v2__summary-value">{card.value}</p>
      <p className="orders-v2__summary-sub">{card.subtitle}</p>
    </>
  );

  if (card.href) {
    return (
      <Link href={card.href} className="orders-v2__summary-card">
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="orders-v2__summary-card"
      onClick={() => card.filter && onFilter(card.filter)}
    >
      {content}
    </button>
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
  const [sort, setSort] = useState<OrdersHubSort>("newest");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const pullStartY = useRef<number | null>(null);

  const sourceOrders = activeTab === "sold" ? soldOrders : boughtOrders;

  const filteredOrders = useMemo(() => {
    const matched = sourceOrders.filter((order) => matchesOrdersHubStatusFilter(order, statusFilter));
    const searched = searchOrdersHub(matched, query, activeTab);
    return sortOrdersHub(searched, sort);
  }, [sourceOrders, statusFilter, query, activeTab, sort]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, statusFilter, sort, query]);

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
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, filteredOrders.length, visibleOrders.length]);

  const summary = useMemo(
    () => (activeTab === "sold" ? buildSoldSummary(soldOrders) : buildBoughtSummary(boughtOrders)),
    [activeTab, soldOrders, boughtOrders],
  );

  const switchTab = (tab: OrderTab) => {
    setStatusFilter("all");
    setQuery("");
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
      if (endY - pullStartY.current > 72) {
        setError(null);
        router.refresh();
      }
      pullStartY.current = null;
    },
    [router],
  );

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
      <BellLineIcon />
      {unreadNotifications > 0 ? <span className="orders-v2__notify-dot" aria-hidden /> : null}
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
        data-orders-ui="v1.0-canonical-mockup"
        data-orders-freeze="pending-visual-qa"
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

        <section className="orders-v2__summary" aria-label="Orders summary">
          {summary.map((card) => (
            <SummaryCard key={card.id} card={card} onFilter={setStatusFilter} />
          ))}
        </section>

        <div className="orders-v2__toolbar">
          <label className="orders-v2__search">
            <span className="sr-only">Search orders</span>
            <OrdersBagIcon className="orders-v2__search-icon" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, product, buyer, seller"
              className="orders-v2__search-input"
            />
          </label>
          <label className="orders-v2__sort">
            <span className="sr-only">Sort orders</span>
            <select
              className="orders-v2__sort-select"
              value={sort}
              onChange={(event) => setSort(event.target.value as OrdersHubSort)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="orders-v2__filters" role="group" aria-label="Order status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={cn(
                "orders-v2__chip",
                statusFilter === filter.id && "orders-v2__chip--active",
              )}
              aria-pressed={statusFilter === filter.id}
              onClick={() => setStatusFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="orders-v2__error" role="alert">
            <p>{error}</p>
            <button type="button" className="orders-v2__error-btn" onClick={() => router.refresh()}>
              Retry
            </button>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="orders-v2__empty">
            <PremiumEmptyStateImage id="orders" className="orders-v2__empty-art" />
            <h2 className="orders-v2__empty-title">No orders yet</h2>
            <p className="orders-v2__empty-body">
              Your orders will appear here after your first purchase or sale.
            </p>
            <div className="orders-v2__empty-actions">
              <Link href="/" className="orders-v2__empty-btn orders-v2__empty-btn--primary">
                Browse Marketplace
              </Link>
              <Link href="/sell" className="orders-v2__empty-btn orders-v2__empty-btn--secondary">
                Sell an Item
              </Link>
            </div>
          </div>
        ) : (
          <ul className="orders-v2__list">
            {visibleOrders.map((order) => (
              <li key={order.id}>
                <OrdersHubCard order={order} tab={activeTab} />
              </li>
            ))}
          </ul>
        )}

        {hasMore ? <div ref={loadMoreRef} className="orders-v2__sentinel" aria-hidden /> : null}
      </div>
    </AccountCanonicalShell>
  );
}
