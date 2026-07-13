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
  type SVGProps,
  type TouchEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { BellLineIcon, ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import { triggerCommerceHaptic } from "@/lib/mobile-ui/haptic";
import { formatOrdersHubDate, getOrdersHubBadge } from "@/lib/orders/hub-status";
import type { Order } from "@/lib/orders/types";
import { formatCurrency } from "@/lib/wallet/utils";
import "@/styles/rovexo/orders-hub-v1.css";

type OrderTab = "sold" | "bought";
type StatusFilter = "all" | "processing" | "completed";

export type OrdersHubV1Props = {
  boughtOrders: Order[];
  soldOrders: Order[];
  unreadNotifications?: number;
};

const PAGE_SIZE = 20;
const SPRING = { type: "spring" as const, duration: 0.25 };

const TABS: { id: OrderTab; label: string }[] = [
  { id: "sold", label: "Sold" },
  { id: "bought", label: "Bought" },
];

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "processing", label: "Processing" },
  { id: "completed", label: "Completed" },
];

type IconProps = SVGProps<SVGSVGElement>;

function PackageOutlineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden {...props}>
      <path
        d="M14 28 40 14l26 14v28L40 70 14 56V28Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M40 14v56M14 28l26 14 26-14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function matchesFilter(order: Order, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "completed") {
    return order.status === "completed" || order.status === "delivered";
  }
  return (
    order.status !== "cancelled" &&
    order.status !== "completed" &&
    order.status !== "delivered"
  );
}

function orderDetailHref(order: Order, tab: OrderTab): string {
  return tab === "sold" ? `/seller/orders/${order.id}` : `/orders/${order.id}`;
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

function OrdersEmptyState({ tab }: { tab: OrderTab }) {
  return (
    <div className="orders-v2__empty" data-orders-empty="minimal">
      <PackageOutlineIcon className="orders-v2__empty-icon" />
      <p className="orders-v2__empty-title">No orders yet.</p>
      <p className="orders-v2__empty-sub">
        {tab === "sold"
          ? "Your sold items will appear here."
          : "Your purchased items will appear here."}
      </p>
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
      <div className="orders-v2__chips">
        {Array.from({ length: 3 }).map((_, i) => (
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
  const reduceMotion = useReducedMotion();
  const activeTab: OrderTab = searchParams.get("tab") === "bought" ? "bought" : "sold";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const pullStartY = useRef<number | null>(null);

  const sourceOrders = activeTab === "sold" ? soldOrders : boughtOrders;

  const filteredOrders = useMemo(() => {
    return [...sourceOrders]
      .filter((order) => matchesFilter(order, statusFilter))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
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
      { rootMargin: "160px" },
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
      <motion.div
        className="orders-v2"
        data-orders-hub-version="v1.0"
        data-orders-ui="v1.0-minimal-canonical"
        data-orders-freeze="pending-visual-qa"
        data-orders-sections="header,tabs,chips,empty-or-list"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
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
              {activeTab === tab.id ? (
                <motion.span
                  layoutId={reduceMotion ? undefined : "orders-tab-underline"}
                  className="orders-v2__tab-underline"
                  transition={SPRING}
                />
              ) : null}
            </button>
          ))}
        </div>

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
          <OrdersEmptyState tab={activeTab} />
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
      </motion.div>
    </AccountCanonicalShell>
  );
}
