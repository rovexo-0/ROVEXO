/**
 * ROVEXO Notifications v1.0 — user control SSOT (channels + categories).
 * Maps to existing `notification_settings` columns (no schema change).
 */

import type { NotificationSettings } from "@/lib/notifications/types";

export type NotificationUserControlId =
  | "push"
  | "email"
  | "orders"
  | "offers"
  | "marketing"
  | "security";

export type NotificationUserControl = {
  id: NotificationUserControlId;
  label: string;
  description: string;
};

/** Canonical ON/OFF controls for Notifications v1.0. */
export const NOTIFICATION_USER_CONTROLS: readonly NotificationUserControl[] = [
  {
    id: "push",
    label: "Push Notifications",
    description: "Receive push alerts on this device",
  },
  {
    id: "email",
    label: "Email Notifications",
    description: "Receive email alerts",
  },
  {
    id: "orders",
    label: "Order Notifications",
    description: "Purchases, shipping, delivery, and refunds",
  },
  {
    id: "offers",
    label: "Offer Notifications",
    description: "Offers and related negotiation updates",
  },
  {
    id: "marketing",
    label: "Marketing Notifications",
    description: "Campaigns, price drops, and stock alerts",
  },
  {
    id: "security",
    label: "Security Notifications",
    description: "Verification, security, and policy alerts",
  },
] as const;

export function readUserControl(
  settings: NotificationSettings,
  id: NotificationUserControlId,
): boolean {
  switch (id) {
    case "push":
      return settings.pushEnabled;
    case "email":
      return (
        settings.emailMessages ||
        settings.emailOrders ||
        settings.emailPromotions ||
        settings.emailMarketing
      );
    case "orders":
      return settings.orders;
    case "offers":
      return settings.offers;
    case "marketing":
      return settings.marketing;
    case "security":
      return settings.system;
  }
}

/** Expand a single control toggle into the existing settings patch shape. */
export function patchForUserControl(
  id: NotificationUserControlId,
  enabled: boolean,
): Partial<NotificationSettings> {
  switch (id) {
    case "push":
      return { pushEnabled: enabled };
    case "email":
      return {
        emailMessages: enabled,
        emailOrders: enabled,
        emailPromotions: enabled,
        emailMarketing: enabled,
      };
    case "orders":
      return { orders: enabled, emailOrders: enabled };
    case "offers":
      return { offers: enabled };
    case "marketing":
      return { marketing: enabled, emailMarketing: enabled, promotions: enabled };
    case "security":
      return { system: enabled };
  }
}
