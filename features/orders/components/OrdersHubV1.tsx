"use client";

import Link from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
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
import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import { triggerCommerceHaptic } from "@/lib/mobile-ui/haptic";
import {
  buildBoughtSummary,
  buildSoldSummary,
  matchesOrdersHubStatusFilter,
  sortOrdersHubNewest,
  type OrdersHubStatusFilter,
  type OrdersHubSummaryCard,
} from "@/lib/orders/hub-summary";
import { formatOrdersHubDate, getOrdersHubBadge } from "@/lib/orders/hub-status";
import type { Order } from "@/lib/orders/types";
import { formatCurrency } from "@/lib/wallet/utils";
import "@/styles/rovexo/orders-hub-v1.css";

type OrderTab = "sold" | "bought";

export type OrdersHubV1Props = {
  boughtOrders: Order[];
  soldOrders: Order[];
  unreadNotifications?: number;
};

const PAGE_SIZE = 20;

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

function SummaryGlyph({ tone }: { tone: OrdersHubSummaryCard["tone"] }) {
  const className = "orders-v2__stat-svg";
  if (tone === "sales") return <PoundLineIcon className={className} />;
  if (tone === "pending") return <WalletLineIcon className={className} />;
  if (tone === "orders") return <TruckLineIcon className={className} />;
  return <StarLineIcon className={className} />;
}

function orderDetailHref(order: Order, tab: OrderTab): string {
  return tab === "sold" ? `/seller/orders/${order.id}` : `/orders/${order.id}`;
}

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
      <div className="orders-v2__stat-copy">
        <p className="orders-v2__stat-title">{card.title}</p>
        <p className="orders-v2__stat-value">{card.value}</p>
        <p className="orders-v2__stat-sub">{card.subtitle}</p>
      </div>
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

const OrdersListCard = memo(function OrdersListCard({
  order,
  tab,
}: {
  order: Order;
  tab: OrderTab;
}) {
  const badge = getOrdersHubBadge(order);
  return (
    <Link href={orderDetailHref(order, tab)} className="orders-v2__list-card">
      <ProductRowImage
        src={order.product.imageUrl}
        alt={order.product.title}
        containerClassName="orders-v2__list-image"
        sizes="72px"
      />
      <div className="orders-v2__list-copy">
        <p className="orders-v2__list-id">Order {order.orderNumber}</p>
        <p className="orders-v2__list-title">{order.product.title}</p>
        <p className="orders-v2__list-meta">
          {formatOrdersHubDate(order.createdAt)} · {formatCurrency(order.totals.total)}
        </p>
      </div>
      <span className={cn("orders-v2__badge", `orders-v2__badge--${badge.tone}`)}>{badge.label}</span>
      <ChevronRightLineIcon className="orders-v2__list-chevron" />
    </Link>
  );
});

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
      <div className="orders-v2__skel orders-v2__skel--empty" />
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
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const pullStartY = useRef<number | null>(null);

  const sourceOrders = activeTab === "sold" ? soldOrders : boughtOrders;

  const filteredOrders = useMemo(() => {
    return sortOrdersHubNewest(
      sourceOrders.filter((order) => matchesOrdersHubStatusFilter(order, statusFilter)),
    );
  }, [sourceOrders, statusFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, statusFilter]);

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
      { rootMargin: "180px" },
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
        data-orders-ui="v1.0-final-statistics"
        data-orders-freeze="pending-visual-qa"
        data-orders-sections="header,tabs,stats-4col,chips,empty-or-list"
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
              {filter.label}
            </button>
          ))}
        </div>

        {visibleOrders.length === 0 ? (
          <div className="orders-v2__empty" data-orders-empty="text-only">
            <p className="orders-v2__empty-title">No orders yet.</p>
          </div>
        ) : (
          <ul className="orders-v2__list">
            {visibleOrders.map((order) => (
              <li key={order.id}>
                <OrdersListCard order={order} tab={activeTab} />
              </li>
            ))}
          </ul>
        )}

        {hasMore ? <div ref={loadMoreRef} className="orders-v2__sentinel" aria-hidden /> : null}
      </div>
    </AccountCanonicalShell>
  );
}
