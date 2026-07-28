/**
 * ROVEXO CANONICAL SWITCH ENGINE v1.0 (LOCKED)
 *
 * ONE PLATFORM = ONE SWITCH. No exceptions.
 * Visual / behaviour SSOT: CanonicalSwitch + cds-switch tokens.
 * Fail-closed: unknown / unavailable state → OFF only.
 */

import { registerSmartFeature } from "@/lib/smart-platform/features";
import { areProductionRulesActive } from "@/lib/master-engine/activation";
import {
  CANONICAL_SWITCH_COMPONENT,
  CANONICAL_SWITCH_DOM,
  CANONICAL_SWITCH_PRODUCTION_READY,
  CANONICAL_SWITCH_SPEC,
  CANONICAL_SWITCH_STATUS,
  CANONICAL_SWITCH_VERSION,
} from "@/lib/design-system/canonical-switch-lock";

export const SWITCH_ENGINE_NAME = "ROVEXO CANONICAL SWITCH ENGINE" as const;
export const SWITCH_ENGINE_VERSION = "v1.0" as const;
export const SWITCH_ENGINE_STATUS = "LOCKED" as const;
export const SWITCH_ENGINE_FEATURE_ID = "canonical-switch-engine" as const;
export const SWITCH_ENGINE_UI_LOCK = true as const;

export const SWITCH_ENGINE_SURFACES = [
  "profile-holiday-mode",
  "settings-notifications",
  "settings-privacy",
  "settings-security",
  "settings-marketing",
  "notifications-page",
  "wallet-future",
  "promotions-future",
  "business-future",
  "admin-future",
  "super-admin-future",
] as const;

export type SwitchEngineSurface = (typeof SWITCH_ENGINE_SURFACES)[number];

/**
 * Fail-closed resolver — only explicit `true` is ON.
 * API / DB / settings unavailable → OFF. Never undefined visual state.
 */
export function resolveCanonicalSwitchChecked(value: unknown): boolean {
  return value === true;
}

/** Disabled opacity / clickability gate (UI must set disabled when true). */
export function resolveCanonicalSwitchDisabled(disabled: unknown): boolean {
  return disabled === true;
}

export function getSwitchEngineSnapshot() {
  return {
    name: SWITCH_ENGINE_NAME,
    version: SWITCH_ENGINE_VERSION,
    status: SWITCH_ENGINE_STATUS,
    uiLock: SWITCH_ENGINE_UI_LOCK,
    productionReady: CANONICAL_SWITCH_PRODUCTION_READY,
    component: CANONICAL_SWITCH_COMPONENT,
    dom: CANONICAL_SWITCH_DOM,
    lockStatus: CANONICAL_SWITCH_STATUS,
    lockVersion: CANONICAL_SWITCH_VERSION,
    spec: CANONICAL_SWITCH_SPEC,
    surfaces: SWITCH_ENGINE_SURFACES,
    productionRulesActive: areProductionRulesActive(),
    showEverything: !areProductionRulesActive(),
  } as const;
}

export function registerCanonicalSwitchEngine(): void {
  registerSmartFeature({
    id: SWITCH_ENGINE_FEATURE_ID,
    label: "Canonical Switch Engine",
    isAvailableInProduction: () => true,
  });
}

registerCanonicalSwitchEngine();

export {
  CANONICAL_SWITCH_COMPONENT,
  CANONICAL_SWITCH_DOM,
  CANONICAL_SWITCH_SPEC,
  CANONICAL_SWITCH_STATUS,
  CANONICAL_SWITCH_VERSION,
} from "@/lib/design-system/canonical-switch-lock";
