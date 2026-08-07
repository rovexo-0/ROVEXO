"use client";

import Link from "next/link";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { cn } from "@/lib/cn";
import type { OrdersV7StatusView } from "@/lib/orders/orders-v7-status";
import type { Order } from "@/lib/orders/types";

type OrdersListItemProps = {
  order: Order;
  href: string;
  status: OrdersV7StatusView;
  /** Buyer: total paid. Seller: item price (never buyer total). */
  priceAmount: number;
};

function StatusGlyph({ tone }: { tone: OrdersV7StatusView["tone"] }) {
  const common = {
    className: "orders-page__item-status-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (tone === "green") {
    return (
      <svg {...common}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (tone === "red") {
    return (
      <svg {...common}>
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    );
  }
  if (tone === "orange" || tone === "yellow") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.3 7 12 12l8.7-5M12 22V12" />
    </svg>
  );
}

function formatOrderListPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Orders list row — density aligned to Inbox Hub Messages list.
 * Thumb 56px · Title · Price · Status · Chevron. No Order ID on the list.
 */
export function OrdersListItem({ order, href, status, priceAmount }: OrdersListItemProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn("orders-page__item", status.cssClass)}
      data-order-id={order.id}
      data-order-status={order.status}
      aria-label={`${order.product.title}, ${formatOrderListPrice(priceAmount)}, ${status.label}`}
    >
      <span className="orders-page__item-thumb" aria-hidden>
        <ProductRowImage
          src={order.product.imageUrl}
          alt=""
          containerClassName="orders-page__item-thumb-media"
          sizes="56px"
        />
      </span>

      <span className="orders-page__item-main">
        <span className="orders-page__item-title">{order.product.title}</span>
        <span className="orders-page__item-price">{formatOrderListPrice(priceAmount)}</span>
        <span className={cn("orders-page__item-status", `orders-page__item-status--${status.tone}`)}>
          <StatusGlyph tone={status.tone} />
          <span className="orders-page__item-status-label">{status.label}</span>
        </span>
      </span>

      <span className="orders-page__item-chevron" aria-hidden>
        <ChevronRightLineIcon />
      </span>
    </Link>
  );
}
