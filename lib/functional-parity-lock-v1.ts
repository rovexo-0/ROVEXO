/**
 * ROVEXO BLOOD LAW — FUNCTIONAL PARITY LOCK v1.0
 *
 * STATUS: ABSOLUTE STOP · OWNER MANDATE
 * Baseline: 9ed6f9b3 — ROVEXO v1.0.0 Production Release
 *
 * Functional parity is inviolable. Performance work is forbidden until
 * every certified surface is re-verified PASS with Owner approval.
 */

export const FUNCTIONAL_PARITY_LOCK_V1 = {
  version: "1.0",
  status: "ABSOLUTE_STOP",
  baselineCommit: "9ed6f9b3",
  baselineLabel: "ROVEXO v1.0.0 Production Release",
  host: "http://localhost:3000",
  equation:
    "100% FUNCTIONAL PARITY WITH CERTIFIED RELEASE = REQUIRED BEFORE ANY PERFORMANCE WORK",
  forbiddenUntilRecertified: [
    "optimization",
    "refactor",
    "cache changes",
    "bundle splitting",
    "CSS splitting",
    "ISR strategy changes",
    "Edge Cache",
    "performance tuning",
    "image engine changes",
    "middleware changes",
    "auth/provider changes",
    "UI/UX/layout/navigation/menu changes",
    "Buyer/Seller logic changes",
  ] as const,
  allowedOnly: ["repair regressions introduced after baseline"] as const,
  nextPerformanceRoadmapBlocked: [
    "Bundle Optimization",
    "CSS Isolation",
    "Route Splitting",
    "Edge Cache",
    "Image Engine",
    "Mobile Performance",
    "Lighthouse ≥ 98",
    "Performance Budget",
    "Phase 11",
  ] as const,
  bloodLaw:
    "Nicio optimizare nu este acceptată dacă reduce chiar și o singură funcționalitate certificată a ROVEXO.",
} as const;

export type FunctionalParityLockV1 = typeof FUNCTIONAL_PARITY_LOCK_V1;
