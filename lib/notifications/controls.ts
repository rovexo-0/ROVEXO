/**
 * ROVEXO Notifications — Switch Engine v1.0 control inventory.
 * Maps Owner-mandated toggles onto existing `notification_settings` columns (no schema change).
 */

import type { NotificationSettings } from "@/lib/notifications/types";
import { resolveCanonicalSwitchChecked } from "@/lib/master-engine/switch-engine";

export type NotificationUserControlId =
  | "orders"
  | "inbox"
  | "wallet"
  | "payments"
  | "promotions"
  | "reviews"
  | "push"
  | "email";

export type NotificationUserControl = {
  id: NotificationUserControlId;
  label: string;
  description: string;
};

/** Canonical ON/OFF controls — Notifications page (Switch Engine LOCK). */
export const NOTIFICATION_USER_CONTROLS: readonly NotificationUserControl[] = [
  { id: "orders", label: "Orders", description: "Purchases, shipping, and delivery" },
  { id: "inbox", label: "Inbox", description: "Messages and conversation alerts" },
  { id: "wallet", label: "Wallet", description: "Balance, payouts, and wallet activity" },
  { id: "payments", label: "Payments", description: "Payment confirmations and receipts" },
  { id: "promotions", label: "Promotions", description: "Promotions and campaigns" },
  { id: "reviews", label: "Reviews", description: "Review requests and new ratings" },
  { id: "push", label: "Push Notifications", description: "Receive push alerts on this device" },
  { id: "email", label: "Email Notifications", description: "Receive email alerts" },
] as const;

export function readUserControl(
  settings: NotificationSettings | null | undefined,
  id: NotificationUserControlId,
): boolean {
  if (!settings) return false;

  switch (id) {
    case "push":
      return resolveCanonicalSwitchChecked(settings.pushEnabled);
    case "email":
      return resolveCanonicalSwitchChecked(
        settings.emailMessages ||
          settings.emailOrders ||
          settings.emailPromotions ||
          settings.emailMarketing,
      );
    case "orders":
      return resolveCanonicalSwitchChecked(settings.orders);
    case "inbox":
      return resolveCanonicalSwitchChecked(settings.messages);
    case "wallet":
      return resolveCanonicalSwitchChecked(settings.marketing);
    case "payments":
      return resolveCanonicalSwitchChecked(settings.offers);
    case "promotions":
      return resolveCanonicalSwitchChecked(settings.promotions);
    case "reviews":
      return resolveCanonicalSwitchChecked(settings.reviews);
  }
}

/** Expand a single control toggle into the existing settings patch shape. */
export function patchForUserControl(
  id: NotificationUserControlId,
  enabled: boolean,
): Partial<NotificationSettings> {
  const on = enabled === true;
  switch (id) {
    case "push":
      return { pushEnabled: on };
    case "email":
      return {
        emailMessages: on,
        emailOrders: on,
        emailPromotions: on,
        emailMarketing: on,
      };
    case "orders":
      return { orders: on, emailOrders: on };
    case "inbox":
      return { messages: on, emailMessages: on };
    case "wallet":
      return { marketing: on, emailMarketing: on };
    case "payments":
      return { offers: on };
    case "promotions":
      return { promotions: on, emailPromotions: on };
    case "reviews":
      return { reviews: on };
  }
}
