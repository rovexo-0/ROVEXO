import {
  createDefaultFeatureToggles,
  FEATURE_MANAGER_SETTING_KEY,
} from "@/lib/super-admin/mission-control/defaults";
import { getPlatformSetting } from "@/lib/super-admin/settings";
import type { FeatureToggleEntry } from "@/lib/design-studio-v1/types";

export async function getFeatureToggleCenter(): Promise<FeatureToggleEntry[]> {
  const toggles = await getPlatformSetting(FEATURE_MANAGER_SETTING_KEY, createDefaultFeatureToggles());
  return toggles.map((toggle) => ({
    id: toggle.id,
    label: toggle.label,
    description: toggle.description,
    enabled: toggle.enabled,
    state: toggle.state,
    version: toggle.version,
    scope: toggle.state === "beta" ? "beta" : toggle.state === "coming-soon" ? "seasonal" : "global",
  }));
}

export function getFeatureToggleStats(entries: FeatureToggleEntry[]) {
  return {
    total: entries.length,
    enabled: entries.filter((e) => e.enabled).length,
    beta: entries.filter((e) => e.scope === "beta").length,
  };
}
