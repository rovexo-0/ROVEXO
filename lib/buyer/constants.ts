import { RovexoIcons } from "@/lib/icons";
import type { BuyerPaymentMethod, BuyerQuickAction, BuyerSettingsLink } from "@/types/buyer";

export const BUYER_DASHBOARD_MAX_WIDTH = 100;

export const BUYER_ACTIVE_ORDER_STATUSES = new Set([
  "awaiting_payment",
  "awaiting_shipment",
  "shipped",
  "issue_open",
]);

export const BUYER_HISTORY_ORDER_STATUSES = new Set(["delivered", "completed", "cancelled"]);

export function buildQuickActions(counts: {
  orders: number;
  saved: number;
  messages: number;
  notifications: number;
}): BuyerQuickAction[] {
  return [
    {
      id: "orders",
      title: "Orders",
      href: "/orders",
      icon: RovexoIcons.orders.orders,
      count: counts.orders,
    },
    {
      id: "saved",
      title: "Saved",
      href: "/saved",
      icon: RovexoIcons.actions.wishlist,
      count: counts.saved,
    },
    {
      id: "messages",
      title: "Messages",
      href: "/messages",
      icon: RovexoIcons.chat.messages,
      count: counts.messages,
    },
    {
      id: "notifications",
      title: "Alerts",
      href: "/notifications",
      icon: RovexoIcons.notifications.bell,
      count: counts.notifications,
    },
  ];
}

export const BUYER_PAYMENT_METHODS: BuyerPaymentMethod[] = [
  {
    id: "apple_pay",
    label: "Apple Pay",
    brand: "apple_pay",
    connected: false,
    icon: RovexoIcons.payments.payment,
  },
  {
    id: "google_pay",
    label: "Google Pay",
    brand: "google_pay",
    connected: false,
    icon: RovexoIcons.payments.payment,
  },
  {
    id: "debit_card",
    label: "Debit Card",
    brand: "card",
    connected: false,
    icon: RovexoIcons.payments.payment,
  },
  {
    id: "bank_account",
    label: "Bank Account",
    brand: "bank",
    connected: false,
    icon: RovexoIcons.dashboard.wallet,
  },
];

export const BUYER_SETTINGS_LINKS: BuyerSettingsLink[] = [
  { id: "language", label: "Language", href: "/account/preferences/language", icon: RovexoIcons.dashboard.settings },
  { id: "currency", label: "Currency", href: "/account/preferences/currency", icon: RovexoIcons.payments.payment },
  { id: "notifications", label: "Notifications", href: "/notifications/settings", icon: RovexoIcons.notifications.bell },
  { id: "privacy", label: "Privacy", href: "/account/privacy", icon: RovexoIcons.security.shield },
];
