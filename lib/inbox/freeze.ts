/**
 * ROVEXO Inbox Hub — freeze markers v1.0
 * STATUS = FROZEN when INBOX_HUB_CANONICAL_FROZEN === true.
 */

export const INBOX_HUB_SPEC_VERSION = "1.0" as const;

/** Canonical freeze — Inbox Hub v1.0 approved production SSOT. */
export const INBOX_HUB_CANONICAL_STATUS = "CANONICAL_FROZEN_v1.0" as const;
export const INBOX_HUB_CANONICAL_FROZEN = true as const;

export const INBOX_HUB_ROUTES = {
  hub: "/inbox",
  conversation: "/inbox/conversation/[conversationId]",
} as const;

export const INBOX_HUB_LEGACY_REDIRECTS = [
  "/messages",
  "/messages/[id]",
  "/notifications",
] as const;

/** Visual tokens locked at freeze (list hub). */
export const INBOX_HUB_VISUAL_LOCK = {
  headerHeightPx: 64,
  controlSizePx: 40,
  tabHeightPx: 44,
  cardRadiusPx: 20,
  cardPaddingPx: 20,
  thumbSizePx: 64,
  pagePadXPx: 16,
  shadow: "0 8px 24px rgb(15 23 42 / 0.06)",
  purple: "#6d28d9",
} as const;

/** Conversation order rail labels locked at freeze. */
export const INBOX_CONVERSATION_STATUS_RAIL = [
  "Paid",
  "Packed",
  "Shipped",
  "Delivered",
  "Completed",
] as const;
