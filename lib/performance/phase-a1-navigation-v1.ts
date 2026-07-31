/**
 * ROVEXO Phase A1 — Performance & Navigation (production-critical).
 * STATUS: EXECUTION · PERFORMANCE ONLY · NO UI REDESIGN
 *
 * Goals: faster route transitions, zero multi-hop loading, fewer duplicate fetches.
 */

export const PHASE_A1_NAVIGATION_V1 = {
  id: "phase-a1-navigation-v1",
  version: "1.0.0",
  status: "ACTIVE",
  scope: "performance-and-navigation-only",
  /** Orders → Conversation must never paint Inbox as an intermediate page. */
  ordersToConversationDirect: true,
  /** `/inbox?order=` resolves server-side when conversation is known. */
  inboxOrderServerRedirect: true,
  /** Inbox list loading must not wrap Conversation routes. */
  inboxLoadingIsolatedToList: true,
  /** Conversation Hub paints from initialConversation; related data loads in background. */
  conversationPaintWithoutRelatedGate: true,
  forbidden: [
    "ui-redesign",
    "feature-additions",
    "schema-changes-unless-required",
    "homepage-menu-settings-branding-search-holiday",
  ],
} as const;

export type PhaseA1NavigationV1 = typeof PHASE_A1_NAVIGATION_V1;
