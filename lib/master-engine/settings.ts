/**
 * ROVEXO Settings — Master Engine visibility (LOCK).
 * Local / QA / Demo / Visual / E2E → SHOW EVERYTHING.
 * Production rules exist but remain inactive until activateProductionRules().
 */

import { registerSmartFeature } from "@/lib/smart-platform/features";
import { areProductionRulesActive } from "@/lib/master-engine/activation";

export const SETTINGS_HUB_FEATURE_ID = "settings-hub" as const;

export function registerSettingsHubFeature(): void {
  registerSmartFeature({
    id: SETTINGS_HUB_FEATURE_ID,
    label: "Settings Hub",
    isAvailableInProduction: () => true,
  });
}

export function resolveSettingsHubVisibility(): { visible: boolean; mode: "show-everything" | "production" } {
  if (!areProductionRulesActive()) {
    return { visible: true, mode: "show-everything" };
  }
  return { visible: true, mode: "production" };
}

registerSettingsHubFeature();
