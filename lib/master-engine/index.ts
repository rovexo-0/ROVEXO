/**
 * ROVEXO MASTER ENGINE v1.0 (LOCK) — public SSOT.
 *
 * Import from `@/lib/master-engine` for platform activation + feature visibility.
 *
 * GOLDEN RULE: no feature may be implemented outside this engine.
 * Use resolveFeatureVisibility / resolveVerifiedStatus / resolveBusinessVisibility /
 * resolveStoreShowcaseVisibility.
 */

export {
  MASTER_ENGINE_DEFAULT_ACTIVE,
  MASTER_ENGINE_NAME,
  MASTER_ENGINE_PRODUCTION_READY,
  MASTER_ENGINE_VERSION,
  activateProductionRules,
  activateProductionPromotionRules,
  areProductionPromotionRulesActive,
  areProductionRulesActive,
  deactivateProductionPromotionRules,
  deactivateProductionRules,
  getMasterEngineSnapshot,
} from "@/lib/master-engine/activation";

/** Golden Rule resolvers — single entry for every feature. */
export {
  resolveBusinessAddressesVisibility,
  resolveBusinessVisibility,
  resolveFeatureVisibility,
  resolveHolidayModeVisibility,
  resolvePromoteVisibility,
  resolveVerifiedStatus,
} from "@/lib/master-engine/resolvers";

export type {
  BusinessAddressesVisibilityResult,
  BusinessVisibilityResult,
  FeatureVisibilityResult,
  MasterUserContext,
  VerifiedStatusResult,
} from "@/lib/master-engine/resolvers";

/** Store Showcase Engine — Master Engine APIs. */
export {
  applyStoreShowcaseProductionRules,
  calculateStoreShowcaseDecay,
  getStoreShowcaseEngineSnapshot,
  getStoreShowcaseOffer,
  registerStoreShowcase,
  resolveStoreShowcasePurchaseGate,
  resolveStoreShowcaseVisibility,
} from "@/lib/master-engine/store-showcase";

export type {
  StoreShowcaseDecayState,
  StoreShowcaseRulesInput,
  StoreShowcaseRulesResult,
  StoreShowcaseVisibilityResult,
} from "@/lib/master-engine/store-showcase";

/** Global Fail Closed Engine — never white-screen / never leak internals. */
export {
  getFailClosedEngineSnapshot,
  isFailClosedCrashPreventionActive,
  registerFailClosedEngine,
  resolveFailClosedState,
  toUserSafeFailClosedMessage,
} from "@/lib/master-engine/fail-closed";

/** Settings hub — Master Engine visibility. */
export { resolveSettingsHubVisibility, registerSettingsHubFeature } from "@/lib/master-engine/settings";

/** Canonical Switch Engine — ONE PLATFORM = ONE SWITCH. */
export {
  SWITCH_ENGINE_FEATURE_ID,
  SWITCH_ENGINE_NAME,
  SWITCH_ENGINE_STATUS,
  SWITCH_ENGINE_SURFACES,
  SWITCH_ENGINE_UI_LOCK,
  SWITCH_ENGINE_VERSION,
  getSwitchEngineSnapshot,
  registerCanonicalSwitchEngine,
  resolveCanonicalSwitchChecked,
  resolveCanonicalSwitchDisabled,
} from "@/lib/master-engine/switch-engine";

/** Full Width Engine — Profile reference · 100% · no cards/borders/shadows. */
export {
  FULL_WIDTH_ENGINE_DOM,
  FULL_WIDTH_CONTRACT_DOM,
  FULL_WIDTH_ENGINE_FEATURE_ID,
  FULL_WIDTH_ENGINE_NAME,
  FULL_WIDTH_ENGINE_SPEC,
  FULL_WIDTH_ENGINE_STATUS,
  FULL_WIDTH_ENGINE_SURFACES,
  FULL_WIDTH_ENGINE_UI_LOCK,
  FULL_WIDTH_ENGINE_VERSION,
  FULL_WIDTH_REFERENCE_PAGE,
  getFullWidthEngineSnapshot,
  registerFullWidthEngine,
} from "@/lib/master-engine/full-width-engine";

/** Master Full Width Contract v1.0 — Profile = design system · 100% width permanent. */
export {
  MASTER_FULL_WIDTH_CONTRACT_DOM,
  MASTER_FULL_WIDTH_CONTRACT_NAME,
  MASTER_FULL_WIDTH_CONTRACT_STATUS,
  MASTER_FULL_WIDTH_CONTRACT_VERSION,
  MASTER_FULL_WIDTH_GOLDEN_RULE,
  MASTER_FULL_WIDTH_SURFACES,
  MASTER_FULL_WIDTH_TOKENS,
  masterFullWidthContractSnapshot,
} from "@/lib/master-engine/master-full-width-contract-v1";

/** Design Protection Absolute v1.1 — Owner design always wins; engines never redesign. */
export {
  DESIGN_PROTECTION_ABSOLUTE_RULE,
  DESIGN_PROTECTION_ABSOLUTE_STATUS,
  DESIGN_PROTECTION_ABSOLUTE_VERSION,
  DESIGN_PROTECTION_CANONICAL_ALLOWED,
  DESIGN_PROTECTION_CANONICAL_FORBIDDEN,
  DESIGN_PROTECTION_ENGINE_ALLOWED,
  DESIGN_PROTECTION_ENGINE_FORBIDDEN,
  DESIGN_PROTECTION_EQUATION,
  DESIGN_PROTECTION_FORBIDDEN_SYSTEMS,
  DESIGN_PROTECTION_GOLDEN_RULE,
  designProtectionAbsoluteSnapshot,
} from "@/lib/master-engine/design-protection-absolute-v1";

/** Implementation Protection Law v1.1 — protect whole Owner-approved implementation; no regression; 100/100. */
export {
  IMPLEMENTATION_PROTECTION_ABSOLUTE_RULE,
  IMPLEMENTATION_PROTECTION_ALLOWED,
  IMPLEMENTATION_PROTECTION_FIVE_QUESTIONS,
  IMPLEMENTATION_PROTECTION_FORBIDDEN,
  IMPLEMENTATION_PROTECTION_GOLDEN_RULE,
  IMPLEMENTATION_PROTECTION_LAW_LEVEL,
  IMPLEMENTATION_PROTECTION_LAW_STATUS,
  IMPLEMENTATION_PROTECTION_LAW_VERSION,
  IMPLEMENTATION_PROTECTION_NO_REGRESSION_RULE,
  IMPLEMENTATION_PROTECTION_OPTIMIZE_FIRST_QUESTION,
  implementationProtectionLawSnapshot,
} from "@/lib/master-engine/implementation-protection-law-v1";

/** Evolution Law v1.0 — evolve in place; protect→optimize→adapt→simplify; never duplicate. */
export {
  EVOLUTION_LAW_ABSOLUTE_RULE,
  EVOLUTION_LAW_GOLDEN_PRINCIPLE,
  EVOLUTION_LAW_MASTER_EQUATION,
  EVOLUTION_LAW_PATH,
  EVOLUTION_LAW_STATUS,
  EVOLUTION_LAW_VERSION,
  evolutionLawSnapshot,
} from "@/lib/master-engine/evolution-law-v1";

/** Full Width Absolute Law v1.0 — 100% width/height; engine adapts to design; zero redesign. */
export {
  FULL_WIDTH_ABSOLUTE_GOLDEN_RULE,
  FULL_WIDTH_ABSOLUTE_LAW_STATUS,
  FULL_WIDTH_ABSOLUTE_LAW_VERSION,
  FULL_WIDTH_ABSOLUTE_RULE,
  fullWidthAbsoluteLawSnapshot,
} from "@/lib/master-engine/full-width-absolute-law-v1";

/** Full Width + Responsive Production Law v1.0 — engine adapts to design; Level 8 P0. */
export {
  FULL_WIDTH_RESPONSIVE_PRODUCTION_ABSOLUTE_RULE,
  FULL_WIDTH_RESPONSIVE_PRODUCTION_GOLDEN_RULE,
  FULL_WIDTH_RESPONSIVE_PRODUCTION_LAW_LEVEL,
  FULL_WIDTH_RESPONSIVE_PRODUCTION_LAW_STATUS,
  FULL_WIDTH_RESPONSIVE_PRODUCTION_LAW_VERSION,
  fullWidthResponsiveProductionLawSnapshot,
} from "@/lib/master-engine/full-width-responsive-production-law-v1";

/** Level 8 Full Width + Responsive Execution — auto-adapt; fail on any defect. */
export {
  FW_RESPONSIVE_EXECUTION_ABSOLUTE_RULE,
  FW_RESPONSIVE_EXECUTION_CERTIFICATION,
  FW_RESPONSIVE_EXECUTION_FAIL_IF,
  FW_RESPONSIVE_EXECUTION_LEVEL,
  FW_RESPONSIVE_EXECUTION_STATUS,
  FW_RESPONSIVE_EXECUTION_VERSION,
  fwResponsiveExecutionSnapshot,
} from "@/lib/master-engine/fw-responsive-execution-v1";

/** Account Settings Engine — one page · fixed Save · Global Switch · Fail Closed. */
export {
  ACCOUNT_SETTINGS_ENGINE_NAME,
  ACCOUNT_SETTINGS_FEATURE_ID,
  ACCOUNT_SETTINGS_STATUS,
  ACCOUNT_SETTINGS_VERSION,
  getAccountSettingsEngineSnapshot,
  registerAccountSettingsEngine,
  resolveAccountSettingsEngineMode,
} from "@/lib/master-engine/account-settings";

/** Platform mode + feature registry (delegates to Smart Platform Engine). */
export {
  SMART_PLATFORM_ENGINE_NAME,
  SMART_PLATFORM_ENGINE_VERSION,
  SMART_PLATFORM_MODES,
  SMART_PLATFORM_PRODUCTION_READY,
  SMART_PLATFORM_SUB_ENGINES,
  SMART_PLATFORM_SURFACES,
  assertSmartMoneyMovement,
  getSmartPlatformEngineSnapshot,
  listSmartFeatures,
  listSmartPlatformEngines,
  registerSmartFeature,
  resolveSmartPlatformMode,
  isSmartPlatformShowEverythingMode,
} from "@/lib/smart-platform";

export type {
  SmartFeatureContext,
  SmartFeatureDefinition,
  SmartFeatureId,
  SmartMoneyGateResult,
  SmartPlatformMode,
  SmartPlatformSubEngine,
  SmartPlatformSurface,
  SmartSubEngineStatus,
} from "@/lib/smart-platform";

export {
  applyProductionVisibilityRules,
  resolveSmartVisibility,
  shouldRenderVerifiedBadge,
  showEverythingVisibility,
} from "@/lib/smart-visibility/engine";

export type { SmartVisibilityInput, SmartVisibilityState } from "@/lib/smart-visibility/engine";
