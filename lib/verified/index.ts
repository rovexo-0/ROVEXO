/**
 * ROVEXO Verified Engine v1.0 — public SSOT exports.
 */

export {
  ROVEXO_VERIFIED_BADGE_NAME,
  ROVEXO_VERIFIED_BADGE_SIZE_PX,
  ROVEXO_VERIFIED_BLUE,
  ROVEXO_VERIFIED_BLUE_DARK,
  ROVEXO_VERIFIED_ENGINE_ACTIVE,
  ROVEXO_VERIFIED_ENGINE_PRODUCTION_READY,
  ROVEXO_VERIFIED_ENGINE_VERSION,
  ROVEXO_VERIFIED_FORBIDDEN_SURFACES,
  ROVEXO_VERIFIED_SURFACES,
  isRovexoVerifiedEngineActive,
} from "@/lib/verified/constants";

export { evaluateDataMatch } from "@/lib/verified/data-match";
export {
  evaluateRovexoVerified,
  isBusinessVerifiedAccount,
  readCachedRovexoVerified,
} from "@/lib/verified/evaluate";
export { recalculateRovexoVerified } from "@/lib/verified/recalculate";
export { assertRovexoVerifiedForMoney } from "@/lib/verified/money-gate";
export { resolveSmartVisibility } from "@/lib/verified/visibility";

export type {
  RovexoDataMatchInput,
  RovexoDataMatchResult,
  RovexoMoneyGateResult,
  RovexoSmartVisibility,
  RovexoVerifiedCheck,
  RovexoVerifiedCheckId,
  RovexoVerifiedEvaluation,
  RovexoVerifiedPath,
} from "@/lib/verified/types";

/** Surface allowlist helper — never show badge on forbidden surfaces. */
export function canShowRovexoVerifiedBadge(surface: string): boolean {
  const forbidden = new Set([
    "payment",
    "checkout",
    "settings",
    "help-centre",
    "legal",
    "sign-out",
    "payment-methods",
    "bank-account-cards",
    "admin-identifiers",
    "sensitive",
  ]);
  return !forbidden.has(surface);
}
