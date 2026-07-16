/**
 * ROVEXO Inbox + Transaction Hub — freeze markers v1.1
 * STATUS = UI LOCK ENABLED when INBOX_HUB_CANONICAL_FROZEN === true.
 */

export const INBOX_HUB_SPEC_VERSION = "1.1" as const;

/** Canonical freeze — Inbox Hub + Transaction Hub v1.1 zoom-out SSOT. */
export const INBOX_HUB_CANONICAL_STATUS = "CANONICAL_UI_LOCK_v1.1" as const;
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

/** Visual tokens — v1.1 global zoom-out (UI only). */
export const INBOX_HUB_VISUAL_LOCK = {
  headerHeightPx: 40,
  controlSizePx: 36,
  tabHeightPx: 34,
  cardRadiusPx: 0,
  cardPaddingPx: 5,
  thumbSizePx: 0,
  pagePadXPx: 12,
  shadow: "none",
  purple: "#6d28d9",
} as const;

/** Order progress step labels (ids unchanged; rail chrome hidden in v1.1 UI). */
export const INBOX_CONVERSATION_STATUS_RAIL = [
  "Paid",
  "Prep",
  "Ship",
  "Done",
  "Paid",
] as const;
