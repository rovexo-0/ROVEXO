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

/** Visual tokens — Vinted size system densify (UI only). */
export const INBOX_HUB_VISUAL_LOCK = {
  headerHeightPx: 56,
  controlSizePx: 40,
  tabHeightPx: 40,
  cardRadiusPx: 16,
  cardPaddingPx: 14,
  thumbSizePx: 52,
  pagePadXPx: 16,
  shadow: "0 8px 24px rgb(15 23 42 / 0.06)",
  purple: "#6d28d9",
} as const;

/** Conversation order rail labels — compact display (same step ids). */
export const INBOX_CONVERSATION_STATUS_RAIL = [
  "Paid",
  "Prep",
  "Ship",
  "Done",
  "Paid",
] as const;
