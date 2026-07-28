/**
 * ROVEXO Canonical Switch v1.0 — LOCKED design-system SSOT.
 * Status: LOCKED · Canonical · Reusable · Mobile First · Dark Mode Ready · Production Ready
 *
 * Sole switch for: Notifications, Holiday Mode, Privacy, Security, Marketing,
 * Push / Email / Orders / Wallet / Payments / Promotions / Reviews,
 * and all future settings. No other switch design allowed.
 *
 * Engine: `@/lib/master-engine/switch-engine` (Canonical Switch Engine v1.0).
 */

export const CANONICAL_SWITCH_STATUS = "LOCKED" as const;
export const CANONICAL_SWITCH_VERSION = "1.0" as const;
export const CANONICAL_SWITCH_CANONICAL = true as const;
export const CANONICAL_SWITCH_PRODUCTION_READY = true as const;

export const CANONICAL_SWITCH_SPEC = {
  visual: { widthPx: 28, heightPx: 16 },
  thumb: { widthPx: 14, heightPx: 14, borderRadius: "50%" },
  hitTarget: { widthPx: 44, heightPx: 44 },
  off: {
    track: "#E5E7EB",
    thumb: "#FFFFFF",
    border: "NONE",
    shadow: "0px 1px 2px rgba(0,0,0,0.08)",
  },
  on: {
    track: "#047857",
    thumb: "#FFFFFF",
    border: "NONE",
    shadow: "0px 1px 2px rgba(0,0,0,0.08)",
  },
  interaction: {
    pressScale: 0.96,
    hoverScale: 0.98,
    disabledOpacity: 0.4,
    transition: "200ms ease-in-out",
  },
  failClosedDefault: false,
} as const;

export const CANONICAL_SWITCH_COMPONENT = "CanonicalSwitch" as const;
export const CANONICAL_SWITCH_DOM = "v1.0" as const;
