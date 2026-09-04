"use client";

import Link from "next/link";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
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
  const emoji =
    tone === "green"
      ? PLATFORM_EMOJI.check
      : tone === "red"
        ? PLATFORM_EMOJI.close
        : tone === "orange" || tone === "yellow"
          ? PLATFORM_EMOJI.warning
          : PLATFORM_EMOJI.listings;
  return <PlatformEmoji emoji={emoji} size={13} className="orders-page__item-status-icon" />;
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
