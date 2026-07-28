/**
 * ROVEXO ACCOUNT SETTINGS ENGINE v1.4 (FINAL LOCK) — Master Engine registration.
 */

import { registerSmartFeature } from "@/lib/smart-platform/features";
import { areProductionRulesActive } from "@/lib/master-engine/activation";
import {
  ACCOUNT_SETTINGS_ENGINE_NAME,
  ACCOUNT_SETTINGS_STATUS,
  ACCOUNT_SETTINGS_VERSION,
  getAccountSettingsEngineSnapshot,
} from "@/lib/account/account-settings-v1";

export const ACCOUNT_SETTINGS_FEATURE_ID = "account-settings-engine" as const;

export function registerAccountSettingsEngine(): void {
  registerSmartFeature({
    id: ACCOUNT_SETTINGS_FEATURE_ID,
    label: "Account Settings Engine",
    isAvailableInProduction: () => true,
  });
}

export function resolveAccountSettingsEngineMode(): {
  mode: "show-everything" | "production";
  snapshot: ReturnType<typeof getAccountSettingsEngineSnapshot>;
} {
  return {
    mode: areProductionRulesActive() ? "production" : "show-everything",
    snapshot: getAccountSettingsEngineSnapshot(),
  };
}

registerAccountSettingsEngine();

export {
  ACCOUNT_SETTINGS_ENGINE_NAME,
  ACCOUNT_SETTINGS_STATUS,
  ACCOUNT_SETTINGS_VERSION,
  getAccountSettingsEngineSnapshot,
};
