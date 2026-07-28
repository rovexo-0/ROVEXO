/**
 * ROVEXO INBOX HUB MASTER IMPLEMENTATION v1.0
 * FINAL CONTRACT · PERMANENTLY LOCKED
 *
 * Inbox Hub = ONLY official Transaction Hub.
 * One feature · one entry point · one implementation.
 * Not a redesign — inherits Profile + Settings + Full Width + Purple CTA.
 */

import { MY_ACCOUNT_PRIMARY_GRADIENT } from "@/lib/design-system/my-account-primary-button-v1";
import { MASTER_FULL_WIDTH_TOKENS } from "@/lib/master-engine/master-full-width-contract-v1";

export const INBOX_HUB_MASTER_NAME = "ROVEXO INBOX HUB MASTER IMPLEMENTATION" as const;
export const INBOX_HUB_MASTER_VERSION = "1.0" as const;
export const INBOX_HUB_MASTER_STATUS = "PERMANENTLY LOCKED" as const;
export const INBOX_HUB_MASTER_DOM = "v1.0-inbox-master" as const;

export const INBOX_HUB_MASTER_ENTRY = "/inbox" as const;
export const INBOX_HUB_MASTER_CONVERSATION = "/inbox/conversation/[conversationId]" as const;

/** Official tabs. */
export const INBOX_HUB_MASTER_TABS = ["Messages", "Notifications"] as const;

/**
 * Transaction domains managed through Inbox Hub (buyer / seller / business / global).
 * Separate list pages must redirect or embed — never parallel hubs.
 */
export const INBOX_HUB_MASTER_DOMAINS = [
  "Messages",
  "Notifications",
  "Buying",
  "Selling",
  "Business",
  "Orders",
  "Offers",
  "Payments",
  "Tracking",
  "Returns",
  "Refunds",
  "Reviews",
  "Disputes",
  "Support",
] as const;

export const INBOX_HUB_MASTER_PURPLE_GRADIENT = MY_ACCOUNT_PRIMARY_GRADIENT;

export const INBOX_HUB_MASTER_TOKENS = {
  headerPx: MASTER_FULL_WIDTH_TOKENS.headerPx,
  width: MASTER_FULL_WIDTH_TOKENS.fullWidth,
  maxWidth: MASTER_FULL_WIDTH_TOKENS.maxWidth,
  paddingXPx: MASTER_FULL_WIDTH_TOKENS.paddingLeftPx,
  primaryCtaHeightPx: MASTER_FULL_WIDTH_TOKENS.primaryButtonPx,
  primaryCtaRadiusPx: MASTER_FULL_WIDTH_TOKENS.radiusPx,
  primaryCtaWidth: MASTER_FULL_WIDTH_TOKENS.primaryCtaWidth,
  /** Empty-state compact CTA (Find something to buy). */
  emptyCtaHeightPx: MASTER_FULL_WIDTH_TOKENS.touchTargetMinPx,
  purpleGradient: INBOX_HUB_MASTER_PURPLE_GRADIENT,
  touchTargetMinPx: MASTER_FULL_WIDTH_TOKENS.touchTargetMinPx,
  tabSplit: "50% / 50%" as const,
} as const;

export const INBOX_HUB_MASTER_BOTTOM_NAV = {
  /** Inbox Hub list (Messages / Notifications). */
  hubShowsBottomNav: true,
  /**
   * Order / transaction conversations — Owner Canonical Negotiation UI:
   * composer is the only bottom chrome (no platform Bottom Navigation).
   */
  conversationHidesBottomNav: true,
  conversationShowsBottomNav: false,
  mayHideBottomNav: [
    "Checkout",
    "Payments",
    "Tracking Details",
    "Leave Review",
    "Open Dispute",
    "Conversation",
  ] as const,
} as const;

export const INBOX_HUB_MASTER_FORBIDDEN = [
  "second Inbox",
  "second Messages page",
  "second Notifications page",
  "second Orders page",
  "second Offers page",
  "second Tracking page",
  "second Payments page",
  "duplicate implementations",
  "80%",
  "85%",
  "90%",
  "centred layouts",
  "mini containers",
  "second design system",
  "blue accent system",
  "grey secondary colour system for CTAs",
] as const;

export const INBOX_HUB_MASTER_INHERITS = [
  "Profile",
  "Settings",
  "Addresses",
  "Rovexo Ideas",
  "Full Width Rule",
  "Mobile First Rule",
  "CTA Design System",
  "Premium Compact Rule",
] as const;

export const INBOX_HUB_MASTER_GOLDEN_RULE =
  "PROFILE + SETTINGS + FULL WIDTH + PURPLE + ONE FEATURE + ONE ENTRY + ONE IMPLEMENTATION + ONE TRANSACTION HUB = INBOX HUB" as const;

export function inboxHubMasterSnapshot() {
  return {
    name: INBOX_HUB_MASTER_NAME,
    version: INBOX_HUB_MASTER_VERSION,
    status: INBOX_HUB_MASTER_STATUS,
    dom: INBOX_HUB_MASTER_DOM,
    entry: INBOX_HUB_MASTER_ENTRY,
    conversation: INBOX_HUB_MASTER_CONVERSATION,
    tabs: [...INBOX_HUB_MASTER_TABS],
    domains: [...INBOX_HUB_MASTER_DOMAINS],
    tokens: INBOX_HUB_MASTER_TOKENS,
    bottomNav: INBOX_HUB_MASTER_BOTTOM_NAV,
    forbidden: [...INBOX_HUB_MASTER_FORBIDDEN],
    inherits: [...INBOX_HUB_MASTER_INHERITS],
    goldenRule: INBOX_HUB_MASTER_GOLDEN_RULE,
  } as const;
}
