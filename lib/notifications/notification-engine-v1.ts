/**
 * ROVEXO Notification Engine v1.0 — canonical Settings inventory + persistence shape.
 * Coarse columns stay in sync for Cluster 8 emit (`notification_preferences`).
 */

import type { NotificationPreferences, NotificationSettings } from "@/lib/notifications/types";
import type { SettingsIconTone } from "@/lib/settings/settings-v1";
import type { SettingsMenuIcon } from "@/lib/account-center/settings-menu";

export const NOTIFICATION_ENGINE_VERSION = "1.0" as const;
export const NOTIFICATION_ENGINE_STATUS = "PRODUCTION" as const;

export type NotificationEngineChannelId =
  | "push"
  | "email"
  | "sms"
  | "whatsapp"
  | "browser";

export type NotificationEngineSecurityId =
  | "newLogin"
  | "newDevice"
  | "passwordChanged"
  | "emailChanged"
  | "phoneChanged"
  | "twoFactor"
  | "suspiciousActivity"
  | "securityAlerts";

export type NotificationEngineTopicId =
  | "orders.orders"
  | "orders.shipping"
  | "orders.delivery"
  | "orders.returns"
  | "orders.refunds"
  | "buying.purchaseConfirmed"
  | "buying.sellerShipped"
  | "buying.parcelTracking"
  | "buying.collectionReminder"
  | "buying.deliveryCompleted"
  | "buying.buyerProtection"
  | "selling.newOffer"
  | "selling.offerAccepted"
  | "selling.offerDeclined"
  | "selling.offerExpired"
  | "selling.listingSold"
  | "selling.listingApproved"
  | "selling.listingRejected"
  | "selling.listingUnderReview"
  | "selling.listingRemoved"
  | "selling.listingExpiringSoon"
  | "selling.boostFinished"
  | "marketplace.newFollowers"
  | "marketplace.favouriteItemActivity"
  | "marketplace.priceDrops"
  | "marketplace.savedSearches"
  | "marketplace.recommendations"
  | "marketplace.recentlyViewed"
  | "wallet.fundsReleased"
  | "wallet.withdrawalCompleted"
  | "wallet.withdrawalFailed"
  | "wallet.lowBalance"
  | "payments.paymentSuccessful"
  | "payments.paymentFailed"
  | "payments.paymentPending"
  | "payments.receipts"
  | "payments.invoices"
  | "reviews.reviewRequests"
  | "reviews.newReviews"
  | "reviews.replies"
  | "support.ticketReplies"
  | "support.appealUpdates"
  | "support.reportUpdates"
  | "platform.maintenance"
  | "platform.platformUpdates"
  | "platform.newFeatures"
  | "platform.legalUpdates";

export type NotificationEngineControl = {
  id: NotificationEngineTopicId | NotificationEngineChannelId | NotificationEngineSecurityId;
  label: string;
  description?: string;
  /** Channel not yet live — structure only, never pretend delivery works. */
  structureOnly?: boolean;
  locked?: boolean;
};

export type NotificationEngineSection = {
  id: string;
  title: string;
  intro?: string;
  icon: SettingsMenuIcon;
  tone: SettingsIconTone;
  kind: "topics" | "channels" | "security";
  controls: readonly NotificationEngineControl[];
};

export type NotificationEngineState = {
  version: typeof NOTIFICATION_ENGINE_VERSION;
  topics: Record<NotificationEngineTopicId, boolean>;
  channels: Record<NotificationEngineChannelId, boolean>;
};

const TOPIC_DEFAULT = true;

const NOTIFICATION_TOPIC_IDS: readonly NotificationEngineTopicId[] = [
  "orders.orders",
  "orders.shipping",
  "orders.delivery",
  "orders.returns",
  "orders.refunds",
  "buying.purchaseConfirmed",
  "buying.sellerShipped",
  "buying.parcelTracking",
  "buying.collectionReminder",
  "buying.deliveryCompleted",
  "buying.buyerProtection",
  "selling.newOffer",
  "selling.offerAccepted",
  "selling.offerDeclined",
  "selling.offerExpired",
  "selling.listingSold",
  "selling.listingApproved",
  "selling.listingRejected",
  "selling.listingUnderReview",
  "selling.listingRemoved",
  "selling.listingExpiringSoon",
  "selling.boostFinished",
  "marketplace.newFollowers",
  "marketplace.favouriteItemActivity",
  "marketplace.priceDrops",
  "marketplace.savedSearches",
  "marketplace.recommendations",
  "marketplace.recentlyViewed",
  "wallet.fundsReleased",
  "wallet.withdrawalCompleted",
  "wallet.withdrawalFailed",
  "wallet.lowBalance",
  "payments.paymentSuccessful",
  "payments.paymentFailed",
  "payments.paymentPending",
  "payments.receipts",
  "payments.invoices",
  "reviews.reviewRequests",
  "reviews.newReviews",
  "reviews.replies",
  "support.ticketReplies",
  "support.appealUpdates",
  "support.reportUpdates",
  "platform.maintenance",
  "platform.platformUpdates",
  "platform.newFeatures",
  "platform.legalUpdates",
] as const;

function allTopics(value: boolean): Record<NotificationEngineTopicId, boolean> {
  return Object.fromEntries(NOTIFICATION_TOPIC_IDS.map((id) => [id, value])) as Record<
    NotificationEngineTopicId,
    boolean
  >;
}

export const NOTIFICATION_SECURITY_CONTROLS: readonly NotificationEngineControl[] = [
  {
    id: "newLogin",
    label: "New Login",
    description: "Required for account security — always on.",
    locked: true,
  },
  {
    id: "newDevice",
    label: "New Device",
    description: "Required for account security — always on.",
    locked: true,
  },
  {
    id: "passwordChanged",
    label: "Password Changed",
    description: "Required for account security — always on.",
    locked: true,
  },
  {
    id: "emailChanged",
    label: "Email Changed",
    description: "Required for account security — always on.",
    locked: true,
  },
  {
    id: "phoneChanged",
    label: "Phone Changed",
    description: "Required for account security — always on.",
    locked: true,
  },
  {
    id: "twoFactor",
    label: "2FA",
    description: "Required for account security — always on.",
    locked: true,
  },
  {
    id: "suspiciousActivity",
    label: "Suspicious Activity",
    description: "Required for account security — always on.",
    locked: true,
  },
  {
    id: "securityAlerts",
    label: "Security Alerts",
    description: "Required for account security — always on.",
    locked: true,
  },
] as const;

export const NOTIFICATION_ENGINE_SECTIONS: readonly NotificationEngineSection[] = [
  {
    id: "orders",
    title: "Orders",
    icon: "bell",
    tone: "orange",
    kind: "topics",
    controls: [
      { id: "orders.orders", label: "Orders" },
      { id: "orders.shipping", label: "Shipping" },
      { id: "orders.delivery", label: "Delivery" },
      { id: "orders.returns", label: "Returns" },
      { id: "orders.refunds", label: "Refunds" },
    ],
  },
  {
    id: "buying",
    title: "Buying",
    icon: "star",
    tone: "blue",
    kind: "topics",
    controls: [
      { id: "buying.purchaseConfirmed", label: "Purchase Confirmed" },
      { id: "buying.sellerShipped", label: "Seller Shipped" },
      { id: "buying.parcelTracking", label: "Parcel Tracking" },
      { id: "buying.collectionReminder", label: "Collection Reminder" },
      { id: "buying.deliveryCompleted", label: "Delivery Completed" },
      { id: "buying.buyerProtection", label: "Buyer Protection Updates" },
    ],
  },
  {
    id: "selling",
    title: "Selling",
    icon: "megaphone",
    tone: "purple",
    kind: "topics",
    controls: [
      { id: "selling.newOffer", label: "New Offer" },
      { id: "selling.offerAccepted", label: "Offer Accepted" },
      { id: "selling.offerDeclined", label: "Offer Declined" },
      { id: "selling.offerExpired", label: "Offer Expired" },
      { id: "selling.listingSold", label: "Listing Sold" },
      { id: "selling.listingApproved", label: "Listing Approved" },
      { id: "selling.listingRejected", label: "Listing Rejected" },
      { id: "selling.listingUnderReview", label: "Listing Under Review" },
      { id: "selling.listingRemoved", label: "Listing Removed" },
      { id: "selling.listingExpiringSoon", label: "Listing Expiring Soon" },
      { id: "selling.boostFinished", label: "Boost Finished" },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    icon: "people",
    tone: "green",
    kind: "topics",
    controls: [
      { id: "marketplace.newFollowers", label: "New Followers" },
      { id: "marketplace.favouriteItemActivity", label: "Favourite Item Activity" },
      { id: "marketplace.priceDrops", label: "Price Drops" },
      { id: "marketplace.savedSearches", label: "Saved Searches" },
      { id: "marketplace.recommendations", label: "Recommendations" },
      { id: "marketplace.recentlyViewed", label: "Recently Viewed Suggestions" },
    ],
  },
  {
    id: "wallet",
    title: "Wallet",
    icon: "wallet",
    tone: "gold",
    kind: "topics",
    controls: [
      { id: "wallet.fundsReleased", label: "Funds Released" },
      { id: "wallet.withdrawalCompleted", label: "Withdrawal Completed" },
      { id: "wallet.withdrawalFailed", label: "Withdrawal Failed" },
      { id: "wallet.lowBalance", label: "Low Balance" },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    icon: "credit-card",
    tone: "blue",
    kind: "topics",
    controls: [
      { id: "payments.paymentSuccessful", label: "Payment Successful" },
      { id: "payments.paymentFailed", label: "Payment Failed" },
      { id: "payments.paymentPending", label: "Payment Pending" },
      { id: "payments.receipts", label: "Receipts" },
      { id: "payments.invoices", label: "Invoices" },
    ],
  },
  {
    id: "reviews",
    title: "Reviews",
    icon: "star",
    tone: "gold",
    kind: "topics",
    controls: [
      { id: "reviews.reviewRequests", label: "Review Requests" },
      { id: "reviews.newReviews", label: "New Reviews" },
      { id: "reviews.replies", label: "Replies" },
    ],
  },
  {
    id: "support",
    title: "Support",
    icon: "headset",
    tone: "soft-red",
    kind: "topics",
    controls: [
      { id: "support.ticketReplies", label: "Ticket Replies" },
      { id: "support.appealUpdates", label: "Appeal Updates" },
      { id: "support.reportUpdates", label: "Report Updates" },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    icon: "info",
    tone: "purple",
    kind: "topics",
    controls: [
      { id: "platform.maintenance", label: "Maintenance" },
      { id: "platform.platformUpdates", label: "Platform Updates" },
      { id: "platform.newFeatures", label: "New Features" },
      { id: "platform.legalUpdates", label: "Legal Updates" },
    ],
  },
  {
    id: "channels",
    title: "Delivery Channels",
    intro: "SMS and WhatsApp are prepared for future delivery — not available yet.",
    icon: "phone",
    tone: "rovexo-blue",
    kind: "channels",
    controls: [
      { id: "push", label: "Push Notifications", description: "Receive push alerts on this device." },
      { id: "email", label: "Email Notifications", description: "Receive email alerts." },
      {
        id: "sms",
        label: "SMS Notifications",
        description: "Structure ready — not available yet.",
        structureOnly: true,
      },
      {
        id: "whatsapp",
        label: "WhatsApp Notifications",
        description: "Structure ready — not available yet.",
        structureOnly: true,
      },
      {
        id: "browser",
        label: "Browser Notifications",
        description: "Browser push alerts when supported.",
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    intro: "Security alerts are always on and cannot be turned off.",
    icon: "shield",
    tone: "red",
    kind: "security",
    controls: NOTIFICATION_SECURITY_CONTROLS,
  },
] as const;

export function createDefaultNotificationEngineState(): NotificationEngineState {
  return {
    version: NOTIFICATION_ENGINE_VERSION,
    topics: allTopics(TOPIC_DEFAULT),
    channels: {
      push: true,
      email: true,
      sms: false,
      whatsapp: false,
      browser: true,
    },
  };
}

function isTopicId(id: string): id is NotificationEngineTopicId {
  return id.includes(".");
}

export function parseNotificationEngineState(raw: unknown): NotificationEngineState {
  const defaults = createDefaultNotificationEngineState();
  if (!raw || typeof raw !== "object") return defaults;
  const obj = raw as Partial<NotificationEngineState>;
  const topics = { ...defaults.topics };
  if (obj.topics && typeof obj.topics === "object") {
    for (const key of Object.keys(topics) as NotificationEngineTopicId[]) {
      if (typeof obj.topics[key] === "boolean") topics[key] = obj.topics[key];
    }
  }
  const channels = { ...defaults.channels };
  if (obj.channels && typeof obj.channels === "object") {
    for (const key of Object.keys(channels) as NotificationEngineChannelId[]) {
      if (typeof obj.channels[key] === "boolean") channels[key] = obj.channels[key];
    }
  }
  // Structure-only channels never store as user-active delivery.
  channels.sms = false;
  channels.whatsapp = false;
  return { version: NOTIFICATION_ENGINE_VERSION, topics, channels };
}

export function applyNotificationEnginePatch(
  current: NotificationEngineState,
  patch: {
    topicId?: NotificationEngineTopicId;
    channelId?: NotificationEngineChannelId;
    enabled?: boolean;
  },
): NotificationEngineState {
  const next = parseNotificationEngineState(current);
  if (patch.topicId && typeof patch.enabled === "boolean") {
    next.topics[patch.topicId] = patch.enabled;
  }
  if (patch.channelId && typeof patch.enabled === "boolean") {
    if (patch.channelId === "sms" || patch.channelId === "whatsapp") {
      next.channels[patch.channelId] = false;
    } else {
      next.channels[patch.channelId] = patch.enabled;
    }
  }
  return next;
}

function anyTopic(state: NotificationEngineState, prefix: string): boolean {
  return Object.entries(state.topics).some(([id, on]) => id.startsWith(prefix) && on === true);
}

/** Derive Cluster 8 preference row from engine state. Security always true. */
export function engineToNotificationPreferences(
  state: NotificationEngineState,
): NotificationPreferences {
  return {
    orders: anyTopic(state, "orders.") || anyTopic(state, "buying."),
    messages: anyTopic(state, "selling.newOffer") || anyTopic(state, "support."),
    payments: anyTopic(state, "payments.") || anyTopic(state, "wallet."),
    support: anyTopic(state, "support."),
    marketing: anyTopic(state, "marketplace.") || anyTopic(state, "platform."),
    security: true,
    business: anyTopic(state, "selling."),
    ai: state.topics["marketplace.recommendations"] === true,
  };
}

/** Keep compatibility `notification_settings` columns aligned. */
export function engineToLegacyNotificationSettings(
  state: NotificationEngineState,
  base?: NotificationSettings | null,
): Partial<NotificationSettings> {
  const emailOn = state.channels.email === true;
  return {
    pushEnabled: state.channels.push === true,
    browserPush: state.channels.browser === true,
    messages: anyTopic(state, "support.") || anyTopic(state, "selling.newOffer"),
    orders: anyTopic(state, "orders.") || anyTopic(state, "buying."),
    offers: anyTopic(state, "selling."),
    reviews: anyTopic(state, "reviews."),
    promotions: state.topics["selling.boostFinished"] === true,
    marketing: anyTopic(state, "marketplace.") || anyTopic(state, "wallet."),
    system: anyTopic(state, "platform.") || true,
    emailMessages: emailOn,
    emailOrders: emailOn && (anyTopic(state, "orders.") || anyTopic(state, "buying.")),
    emailPromotions: emailOn && anyTopic(state, "marketplace."),
    emailMarketing: emailOn && anyTopic(state, "platform."),
    quietHoursEnabled: base?.quietHoursEnabled ?? false,
    quietHoursStart: base?.quietHoursStart ?? "22:00",
    quietHoursEnd: base?.quietHoursEnd ?? "07:00",
    sound: base?.sound ?? true,
    vibration: base?.vibration ?? true,
  };
}

/** Bootstrap engine from legacy settings when jsonb is empty. */
export function hydrateEngineFromLegacySettings(
  settings: NotificationSettings | null | undefined,
): NotificationEngineState {
  const state = createDefaultNotificationEngineState();
  if (!settings) return state;
  const on = (v: boolean) => v === true;
  state.channels.push = on(settings.pushEnabled);
  state.channels.email = on(
    settings.emailMessages ||
      settings.emailOrders ||
      settings.emailPromotions ||
      settings.emailMarketing,
  );
  state.channels.browser = on(settings.browserPush);
  for (const id of Object.keys(state.topics) as NotificationEngineTopicId[]) {
    if (id.startsWith("orders.") || id.startsWith("buying.")) state.topics[id] = on(settings.orders);
    else if (id.startsWith("selling.")) state.topics[id] = on(settings.offers);
    else if (id.startsWith("reviews.")) state.topics[id] = on(settings.reviews);
    else if (id.startsWith("marketplace.")) state.topics[id] = on(settings.promotions);
    else if (id.startsWith("wallet.") || id.startsWith("payments."))
      state.topics[id] = on(settings.marketing) || on(settings.offers);
    else if (id.startsWith("support.")) state.topics[id] = on(settings.messages);
    else if (id.startsWith("platform.")) state.topics[id] = on(settings.system);
  }
  return state;
}

export function isNotificationSecurityControlId(id: string): id is NotificationEngineSecurityId {
  return NOTIFICATION_SECURITY_CONTROLS.some((c) => c.id === id);
}

export function isNotificationChannelId(id: string): id is NotificationEngineChannelId {
  return id === "push" || id === "email" || id === "sms" || id === "whatsapp" || id === "browser";
}

export function isNotificationTopicId(id: string): id is NotificationEngineTopicId {
  return isTopicId(id) && id in createDefaultNotificationEngineState().topics;
}

export function listNotificationEngineTopicIds(): NotificationEngineTopicId[] {
  return Object.keys(createDefaultNotificationEngineState().topics) as NotificationEngineTopicId[];
}
