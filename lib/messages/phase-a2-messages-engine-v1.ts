/**
 * ROVEXO Phase A2 — Messages Engine certification lock.
 * STATUS: EXECUTION · MESSAGES ONLY · NO CROSS-MODULE UI
 */

export const PHASE_A2_MESSAGES_ENGINE_V1 = {
  id: "phase-a2-messages-engine-v1",
  version: "1.0.0",
  status: "ACTIVE",
  scope: "messages-engine-only",
  rootCause:
    "Realtime INSERT replaced signed photo URLs with private storage paths; MessageBubble treated paths as images → broken / Shared photo fallback.",
  fixes: [
    "preserve-signed-url-on-realtime-merge",
    "client-sign-storage-paths",
    "server-sign-on-load-and-append",
    "heic-normalize-compress-once",
    "gallery-intent-no-forced-capture",
    "upload-inflight-guard",
  ],
  forbiddenModules: [
    "homepage",
    "sell",
    "orders",
    "wallet",
    "balance",
    "settings",
    "search",
    "holiday-mode",
    "business",
    "navigation",
    "branding",
    "listing-cards",
  ],
} as const;

export type PhaseA2MessagesEngineV1 = typeof PHASE_A2_MESSAGES_ENGINE_V1;
