/**
 * ROVEXO Smart Visibility Engine v1.0 — public exports.
 */

export {
  SMART_VISIBILITY_ENGINE_ACTIVE,
  SMART_VISIBILITY_ENGINE_VERSION,
  SMART_VISIBILITY_PRODUCTION_READY,
  applyProductionVisibilityRules,
  isSmartVisibilityEngineActive,
  resolveSmartVisibility,
  shouldRenderVerifiedBadge,
  showEverythingVisibility,
} from "@/lib/smart-visibility/engine";

export type { SmartVisibilityInput, SmartVisibilityState } from "@/lib/smart-visibility/engine";
