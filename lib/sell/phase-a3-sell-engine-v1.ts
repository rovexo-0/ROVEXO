/**
 * ROVEXO Phase A3 — Sell Engine performance + Shipping Label certification.
 * STATUS: EXECUTION · SELL + SHIPPING LABEL ONLY · NO UI REDESIGN
 */

export const PHASE_A3_SELL_ENGINE_V1 = {
  id: "phase-a3-sell-engine-v1",
  version: "1.0.0",
  status: "ACTIVE",
  scope: "sell-photos-publish-shipping-labels",
  rootCauses: [
    "Sell intake blocked setDraft until compress+thumbnail+fingerprint+pipeline finished",
    "Upload recreated thumbnails after intake already prepared files",
    "Shipping label CSP blocked blob/object embeds in production",
    "window.open(..., noopener) returned null — print never ran",
    "Label storage path not persisted after PDF upload (expired carrier URLs)",
  ],
  forbiddenModules: [
    "homepage",
    "messages",
    "orders",
    "wallet",
    "balance",
    "settings",
    "search",
    "profile",
    "holiday-mode",
    "business",
    "navigation",
    "branding",
    "listing-cards",
    "sell-ui-redesign",
  ],
} as const;

export type PhaseA3SellEngineV1 = typeof PHASE_A3_SELL_ENGINE_V1;
