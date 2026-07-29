/**
 * ROVEXO Teddy Empty State Engine v1.1 — Static Premium Edition
 * Isolated presentation layer only — no search/browse/product coupling.
 * Zero animation · zero timers · zero motion.
 */

export const TEDDY_EMPTY_STATE_V1 = {
  version: "1.1",
  status: "SAFE_ISOLATED_STATIC",
  motion: "none",
  offsetYPx: 50,
  assetSrc: "/assets/teddy/teddy-shrug.png",
} as const;

export type TeddyEmptyStateProps = {
  visible: boolean;
};
