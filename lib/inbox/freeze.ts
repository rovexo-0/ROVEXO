/**
 * ROVEXO Inbox + Transaction Hub — freeze markers
 * STATUS: MASTER IMPLEMENTATION v1.0 · PERMANENTLY LOCKED
 * Visual tokens inherit Profile / Full Width / Purple CTA (not a redesign).
 */

import {
  INBOX_HUB_MASTER_PURPLE_GRADIENT,
  INBOX_HUB_MASTER_STATUS,
  INBOX_HUB_MASTER_TOKENS,
  INBOX_HUB_MASTER_VERSION,
} from "@/lib/inbox/inbox-hub-master-v1";

export const INBOX_HUB_SPEC_VERSION = INBOX_HUB_MASTER_VERSION;

/** Canonical freeze — Inbox Hub = only Transaction Hub. */
export const INBOX_HUB_CANONICAL_STATUS = INBOX_HUB_MASTER_STATUS;
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

/** Visual tokens — Master Implementation v1.0 (Profile + Full Width + Purple). */
export const INBOX_HUB_VISUAL_LOCK = {
  headerHeightPx: INBOX_HUB_MASTER_TOKENS.headerPx,
  controlSizePx: 48,
  tabHeightPx: 44,
  cardRadiusPx: 0,
  cardPaddingPx: 0,
  thumbSizePx: 0,
  pagePadXPx: INBOX_HUB_MASTER_TOKENS.paddingXPx,
  width: INBOX_HUB_MASTER_TOKENS.width,
  maxWidth: INBOX_HUB_MASTER_TOKENS.maxWidth,
  shadow: "none",
  purple: "#9333ea",
  purpleGradient: INBOX_HUB_MASTER_PURPLE_GRADIENT,
  primaryCtaHeightPx: INBOX_HUB_MASTER_TOKENS.primaryCtaHeightPx,
  primaryCtaRadiusPx: INBOX_HUB_MASTER_TOKENS.primaryCtaRadiusPx,
  primaryCtaWidth: INBOX_HUB_MASTER_TOKENS.primaryCtaWidth,
  emptyCtaHeightPx: INBOX_HUB_MASTER_TOKENS.emptyCtaHeightPx,
  tabSplit: INBOX_HUB_MASTER_TOKENS.tabSplit,
} as const;

/** Order progress step labels (ids unchanged; rail chrome hidden in UI). */
export const INBOX_CONVERSATION_STATUS_RAIL = [
  "Paid",
  "Prep",
  "Ship",
  "Done",
  "Paid",
] as const;
