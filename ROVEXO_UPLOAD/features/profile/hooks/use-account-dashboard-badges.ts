"use client";

import { useCallback, useState } from "react";
import type { DashboardBadgeKey } from "@/lib/profile/dashboard-sections";
import { useVisibilityPolling } from "@/lib/performance/hooks";
import { fetchDeduped } from "@/lib/performance/fetch";

export type AccountDashboardBadges = Record<DashboardBadgeKey, number>;

type BadgeState = {
  messages: number;
  notifications: number;
  orders: number;
  saved: number;
  cart: number;
  walletPayout: number;
};

const POLL_INTERVAL_MS = 60_000;

const INITIAL: BadgeState = {
  messages: 0,
  notifications: 0,
  orders: 0,
  saved: 0,
  cart: 0,
  walletPayout: 0,
};

function countActiveOrders(
  orders: Array<{ status?: string }> | undefined,
): number {
  if (!orders?.length) return 0;
  const active = new Set(["pending", "paid", "processing", "shipped", "confirmed"]);
  return orders.filter((order) => active.has(order.status ?? "")).length;
}

export function useAccountDashboardBadges(
  initial: Partial<BadgeState> & { isSeller?: boolean },
): AccountDashboardBadges {
  const [badges, setBadges] = useState<BadgeState>({
    ...INITIAL,
    messages: initial.messages ?? 0,
    notifications: initial.notifications ?? 0,
  });

  const refresh = useCallback(async () => {
    try {
      const requestInit = { cache: "no-store" as const };
      const responses = await Promise.all([
        fetchDeduped("/api/messages", { ...requestInit, dedupeKey: "account-badges:messages" }),
        fetchDeduped("/api/notifications", { ...requestInit, dedupeKey: "account-badges:notifications" }),
        fetchDeduped("/api/cart", { ...requestInit, dedupeKey: "account-badges:cart" }),
        fetchDeduped("/api/saved", { ...requestInit, dedupeKey: "account-badges:saved" }),
        fetchDeduped("/api/orders", { ...requestInit, dedupeKey: "account-badges:orders" }),
      ]);

      if (responses.some((response) => !response.ok)) return;

      const [messagesPayload, notificationsPayload, cartPayload, savedPayload, ordersPayload] =
        await Promise.all(responses.map((response) => response.json()));

      const messages = (messagesPayload as { conversations?: Array<{ unreadCount?: number }> })
        .conversations;
      const notifications = (notificationsPayload as { notifications?: Array<{ read?: boolean }> })
        .notifications;
      const cart = (cartPayload as { cart?: { itemCount?: number } }).cart;
      const saved = (savedPayload as { items?: unknown[] }).items;
      const orders = (ordersPayload as { orders?: Array<{ status?: string }> }).orders;

      let walletPayout = 0;
      if (initial.isSeller) {
        const sales = countActiveOrders(orders);
        walletPayout = sales > 0 ? 1 : 0;
      }

      setBadges({
        messages: (messages ?? []).reduce((sum, item) => sum + (item.unreadCount ?? 0), 0),
        notifications: (notifications ?? []).filter((item) => !item.read).length,
        cart: cart?.itemCount ?? 0,
        saved: saved?.length ?? 0,
        orders: countActiveOrders(orders),
        walletPayout,
      });
    } catch {
      // Ignore transient network errors.
    }
  }, [initial.isSeller]);

  useVisibilityPolling(() => void refresh(), POLL_INTERVAL_MS, {
    immediate: true,
    refreshOnVisible: true,
  });

  return {
    messages: badges.messages,
    notifications: badges.notifications,
    orders: badges.orders,
    saved: badges.saved,
    cart: badges.cart,
    "wallet-payout": badges.walletPayout,
  };
}
