/**
 * ROVEXO Global Smart Platform Engine v1.0 — public SSOT.
 *
 * Import from `@/lib/smart-platform` for every new feature from today forward.
 */

export {
  SMART_PLATFORM_ENGINE_ACTIVE,
  SMART_PLATFORM_ENGINE_NAME,
  SMART_PLATFORM_ENGINE_VERSION,
  SMART_PLATFORM_MODES,
  SMART_PLATFORM_PRODUCTION_READY,
  SMART_PLATFORM_SHOW_EVERYTHING_MODES,
  SMART_PLATFORM_SUB_ENGINES,
  SMART_PLATFORM_SURFACES,
} from "@/lib/smart-platform/constants";

export type {
  SmartPlatformMode,
  SmartPlatformSubEngine,
  SmartPlatformSurface,
} from "@/lib/smart-platform/constants";

export {
  isSmartPlatformProductionActive,
  isSmartPlatformShowEverythingMode,
  resolveSmartPlatformMode,
} from "@/lib/smart-platform/mode";

export {
  getSmartPlatformEngineSnapshot,
  getSmartSubEngineStatus,
  listSmartPlatformEngines,
} from "@/lib/smart-platform/engines";

export type { SmartSubEngineStatus } from "@/lib/smart-platform/engines";

export {
  getSmartFeature,
  listSmartFeatures,
  registerCanonicalSmartFeatures,
  registerSmartFeature,
  resolveFeatureVisibility,
} from "@/lib/smart-platform/features";

export type {
  SmartFeatureContext,
  SmartFeatureDefinition,
  SmartFeatureId,
} from "@/lib/smart-platform/features";

export { assertSmartMoneyMovement } from "@/lib/smart-platform/money";
export type { SmartMoneyGateResult } from "@/lib/smart-platform/money";

/** Visibility resolver — delegates to Smart Visibility Engine under platform gate. */
export {
  applyProductionVisibilityRules,
  resolveSmartVisibility,
  shouldRenderVerifiedBadge,
  showEverythingVisibility,
} from "@/lib/smart-visibility/engine";

export type { SmartVisibilityInput, SmartVisibilityState } from "@/lib/smart-visibility/engine";
