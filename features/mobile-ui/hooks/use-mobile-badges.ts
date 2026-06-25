"use client";

import { useEffect, useState } from "react";
import type { MobileBadgeKey, MobileBadges } from "@/lib/mobile-ui/types";

type BadgeState = {
  messages: number;
  notifications: number;
  orders: number;
  saved: number;
  cart: number;
  walletPayout: number;
};

const POLL_MS = 60_000;

const INITIAL: BadgeState = {
  messages: 0,
  notifications: 0,
  orders: 0,
  saved: 0,
  cart: 0,
  walletPayout: 0,
};

function countActiveOrders(orders: Array<{ status?: string }> | undefined): number {
  if (!orders?.length) return 0;
  const active = new Set(["pending", "paid", "processing", "shipped", "confirmed"]);
  return orders.filter((order) => active.has(order.status ?? "")).length;
}

export function useMobileBadges(initial?: Partial<BadgeState> & { isSeller?: boolean }): MobileBadges {
  const [badges, setBadges] = useState<BadgeState>({
    ...INITIAL,
    messages: initial?.messages ?? 0,
    notifications: initial?.notifications ?? 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const responses = await Promise.all([
          fetch("/api/messages", { cache: "no-store" }),
          fetch("/api/notifications", { cache: "no-store" }),
          fetch("/api/cart", { cache: "no-store" }),
          fetch("/api/saved", { cache: "no-store" }),
          fetch("/api/orders", { cache: "no-store" }),
        ]);

        if (responses.some((r) => !r)) return;
        if (responses.some((r) => !r.ok)) return;

        const payloads = await Promise.all(responses.map((r) => r.json()));
        if (cancelled) return;

        const [messagesPayload, notificationsPayload, cartPayload, savedPayload, ordersPayload] =
          payloads;

        const messages = messagesPayload as { conversations?: Array<{ unreadCount?: number }> };
        const notifications = notificationsPayload as { notifications?: Array<{ read?: boolean }> };
        const cart = cartPayload as { cart?: { itemCount?: number } };
        const saved = savedPayload as { items?: unknown[] };
        const orders = ordersPayload as { orders?: Array<{ status?: string }> };

        let walletPayout = 0;
        if (initial?.isSeller) {
          walletPayout = countActiveOrders(orders.orders) > 0 ? 1 : 0;
        }

        setBadges({
          messages: (messages.conversations ?? []).reduce((s, c) => s + (c.unreadCount ?? 0), 0),
          notifications: (notifications.notifications ?? []).filter((n) => !n.read).length,
          cart: cart.cart?.itemCount ?? 0,
          saved: saved.items?.length ?? 0,
          orders: countActiveOrders(orders.orders),
          walletPayout,
        });
      } catch {
        // ignore
      }
    }

    void refresh();
    const id = window.setInterval(refresh, POLL_MS);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", refresh);
    };
  }, [initial?.isSeller]);

  return {
    messages: badges.messages,
    notifications: badges.notifications,
    orders: badges.orders,
    saved: badges.saved,
    cart: badges.cart,
    "wallet-payout": badges.walletPayout,
  };
}

export function resolveMobileBadge(
  key: MobileBadgeKey | undefined,
  badges: MobileBadges,
  override?: number,
): number {
  if (override != null) return override;
  if (!key) return 0;
  return badges[key] ?? 0;
}
