/**
 * DESIGN DECISION #002 — Dual Layout Token Isolation
 * STATUS: OWNER APPROVED · PERMANENT
 *
 * Companion to DESIGN DECISION #001 (pad values).
 *
 * ```
 * Homepage 24px  →  never inherit  →  Internal Layout Tokens
 * Internal 16px  →  never inherit  →  Homepage Tokens
 * ```
 *
 * Two independent token families. Never bridge, alias across, or mutate
 * one family's variables from the other.
 */

import {
  HOMEPAGE_PAD_X_PX,
  INTERNAL_PAD_X_PX,
} from "@/lib/design-system/design-decision-001-internal-ui-v1.1";

export const DESIGN_DECISION_002_ID = "DESIGN_DECISION_002" as const;
export const DESIGN_DECISION_002_STATUS = "APPROVED" as const;
export const DESIGN_DECISION_002_LAW = "NEVER_INHERIT" as const;

/** Homepage Layout Tokens — marketing `/` only. */
export const HOMEPAGE_LAYOUT_TOKENS = {
  family: "homepage" as const,
  padXPx: HOMEPAGE_PAD_X_PX,
  /** Canonical CSS custom property names (Homepage family only). */
  cssVars: ["--homepage-pad-x", "--hp-shell-pad"] as const,
  /** Forbidden: reading or writing Internal family vars on Homepage surfaces. */
  neverInheritFrom: [
    "--fw-pad-x",
    "--internal-pad-x",
    "--rx-phone-inset-x",
    "--cds-space-page-x",
  ] as const,
} as const;

/** Internal Layout Tokens — Account / commerce / Full Width Engine. */
export const INTERNAL_LAYOUT_TOKENS = {
  family: "internal" as const,
  padXPx: INTERNAL_PAD_X_PX,
  /** Canonical CSS custom property names (Internal family only). */
  cssVars: [
    "--fw-pad-x",
    "--internal-pad-x",
    "--rx-phone-inset-x",
    "--cds-space-page-x",
  ] as const,
  /** Forbidden: reading or writing Homepage family vars on Internal surfaces. */
  neverInheritFrom: ["--homepage-pad-x", "--hp-shell-pad"] as const,
} as const;

export const DESIGN_DECISION_002_FORBIDDEN = [
  "Homepage inherits Internal Layout Tokens",
  "Internal inherits Homepage Tokens",
  "body:has(.rovexo-page-home) mutates --rx-phone-inset-x / --fw-pad-x / --cds-space-page-x from Homepage",
  "--homepage-pad-x: var(--fw-pad-x)",
  "--fw-pad-x: var(--homepage-pad-x)",
  "--rx-phone-inset-x: var(--homepage-pad-x)",
  "--homepage-pad-x: var(--rx-phone-inset-x)",
] as const;

export function designDecision002Snapshot() {
  return {
    id: DESIGN_DECISION_002_ID,
    status: DESIGN_DECISION_002_STATUS,
    law: DESIGN_DECISION_002_LAW,
    homepage: HOMEPAGE_LAYOUT_TOKENS,
    internal: INTERNAL_LAYOUT_TOKENS,
    forbidden: [...DESIGN_DECISION_002_FORBIDDEN],
  } as const;
}
