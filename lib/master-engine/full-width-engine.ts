/**
 * ROVEXO FULL WIDTH ENGINE v1.0 (LOCKED)
 * Backed by MASTER FULL WIDTH CONTRACT v1.1 — Profile = official visual reference.
 *
 * DESIGN DECISION #001: Internal L/R 16px · Homepage L/R 24px (LOCKED).
 * Forbidden: borders · decorative cards · shadows · boxes · custom widths · custom spacing.
 * Required: 100% width · flat rows · Switch Engine · chevron >
 */

import { registerSmartFeature } from "@/lib/smart-platform/features";
import { areProductionRulesActive } from "@/lib/master-engine/activation";
import {
  MASTER_FULL_WIDTH_CONTRACT_DOM,
  MASTER_FULL_WIDTH_CONTRACT_STATUS,
  MASTER_FULL_WIDTH_SURFACES,
  MASTER_FULL_WIDTH_TOKENS,
} from "@/lib/master-engine/master-full-width-contract-v1";
import {
  FW_RESPONSIVE_EXECUTION_CERTIFICATION,
  FW_RESPONSIVE_EXECUTION_FAIL_IF,
  FW_RESPONSIVE_EXECUTION_LEVEL,
  FW_RESPONSIVE_EXECUTION_STATUS,
  FW_RESPONSIVE_EXECUTION_VERSION,
} from "@/lib/master-engine/fw-responsive-execution-v1";

export const FULL_WIDTH_ENGINE_NAME = "ROVEXO FULL WIDTH ENGINE" as const;
export const FULL_WIDTH_ENGINE_VERSION = "v1.0" as const;
export const FULL_WIDTH_ENGINE_STATUS = "LOCKED" as const;
export const FULL_WIDTH_ENGINE_FEATURE_ID = "full-width-engine" as const;
export const FULL_WIDTH_ENGINE_UI_LOCK = true as const;
export const FULL_WIDTH_ENGINE_DOM = "v1.0" as const;
export const FULL_WIDTH_CONTRACT_DOM = MASTER_FULL_WIDTH_CONTRACT_DOM;

/** Official reference surface. */
export const FULL_WIDTH_REFERENCE_PAGE = "profile" as const;

export const FULL_WIDTH_ENGINE_SPEC = {
  width: MASTER_FULL_WIDTH_TOKENS.fullWidth,
  maxWidth: MASTER_FULL_WIDTH_TOKENS.maxWidth,
  paddingLeftPx: MASTER_FULL_WIDTH_TOKENS.paddingLeftPx,
  paddingRightPx: MASTER_FULL_WIDTH_TOKENS.paddingRightPx,
  paddingTopPx: MASTER_FULL_WIDTH_TOKENS.topSpacingPx,
  paddingBottomPx: MASTER_FULL_WIDTH_TOKENS.topSpacingPx,
  sectionSpacingPx: MASTER_FULL_WIDTH_TOKENS.sectionSpacingPx,
  headerPx: MASTER_FULL_WIDTH_TOKENS.headerPx,
  primaryButtonPx: MASTER_FULL_WIDTH_TOKENS.primaryButtonPx,
  radiusPx: MASTER_FULL_WIDTH_TOKENS.radiusPx,
  inputHeightPx: MASTER_FULL_WIDTH_TOKENS.inputHeightPx,
  touchTargetMinPx: MASTER_FULL_WIDTH_TOKENS.touchTargetMinPx,
  primaryCtaWidth: MASTER_FULL_WIDTH_TOKENS.primaryCtaWidth,
  rowWidth: "100%",
  rowMinHeightPx: 56,
  forbidden: [
    "borders",
    "decorative-cards",
    "shadows",
    "containers",
    "boxes",
    "section-borders",
    "centered-layouts",
    "mini-cards",
    "floating-containers",
    "secondary-layouts",
    "70%",
    "80%",
    "85%",
    "90%",
    "95%",
    "320px",
    "360px",
    "390px",
    "420px",
  ] as const,
  chevron: ">" as const,
  switchEngine: "ROVEXO SWITCH ENGINE v1.0" as const,
  contractStatus: MASTER_FULL_WIDTH_CONTRACT_STATUS,
} as const;

export const FULL_WIDTH_ENGINE_SURFACES = [
  ...MASTER_FULL_WIDTH_SURFACES,
  "personal-information",
  "promotions",
  "payment-methods",
  "personal-bank",
  "business-bank",
  "delete-account",
] as const;

export type FullWidthEngineSurface = (typeof FULL_WIDTH_ENGINE_SURFACES)[number];

export function getFullWidthEngineSnapshot() {
  return {
    name: FULL_WIDTH_ENGINE_NAME,
    version: FULL_WIDTH_ENGINE_VERSION,
    status: FULL_WIDTH_ENGINE_STATUS,
    uiLock: FULL_WIDTH_ENGINE_UI_LOCK,
    dom: FULL_WIDTH_ENGINE_DOM,
    contractDom: FULL_WIDTH_CONTRACT_DOM,
    reference: FULL_WIDTH_REFERENCE_PAGE,
    spec: FULL_WIDTH_ENGINE_SPEC,
    surfaces: FULL_WIDTH_ENGINE_SURFACES,
    productionRulesActive: areProductionRulesActive(),
    showEverything: !areProductionRulesActive(),
    level8Execution: {
      version: FW_RESPONSIVE_EXECUTION_VERSION,
      status: FW_RESPONSIVE_EXECUTION_STATUS,
      level: FW_RESPONSIVE_EXECUTION_LEVEL,
      certification: FW_RESPONSIVE_EXECUTION_CERTIFICATION,
      failIf: FW_RESPONSIVE_EXECUTION_FAIL_IF,
    },
  } as const;
}

export function registerFullWidthEngine(): void {
  registerSmartFeature({
    id: FULL_WIDTH_ENGINE_FEATURE_ID,
    label: "Full Width Engine",
    isAvailableInProduction: () => true,
  });
}

registerFullWidthEngine();
