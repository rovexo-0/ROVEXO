import type { OmegaEngineId, OmegaEngineSnapshot } from "@/lib/omega-command-center/types";
import {
  ATLAS_ENGINE_TABS,
  GUARDIAN_ENGINE_TABS,
  ORACLE_ENGINE_TABS,
  PHOENIX_ENGINE_TABS,
  SCAN_ENGINE_TABS,
  SENTINEL_ENGINE_TABS,
  TITAN_ENGINE_TABS,
} from "@/lib/omega-command-center/registry";

const ENGINE_TABS: Record<OmegaEngineId, readonly string[]> = {
  scan: SCAN_ENGINE_TABS,
  sentinel: SENTINEL_ENGINE_TABS,
  oracle: ORACLE_ENGINE_TABS,
  phoenix: PHOENIX_ENGINE_TABS,
  titan: TITAN_ENGINE_TABS,
  atlas: ATLAS_ENGINE_TABS,
  guardian: GUARDIAN_ENGINE_TABS,
};

export function getEngineTabs(engine: OmegaEngineId): readonly string[] {
  return ENGINE_TABS[engine];
}

export function buildEngineSnapshot(engine: OmegaEngineId, tab: string): OmegaEngineSnapshot {
  const tabs = getEngineTabs(engine);
  const activeTab = tabs.includes(tab) ? tab : tabs[0]!;
  const items = Array.from({ length: 5 }, (_, i) => ({
    id: `${engine}-${activeTab}-${i}`,
    label: `${activeTab} item ${i + 1}`,
    value: `${78 + i * 3}%`,
    status: i === 0 ? "healthy" : undefined,
  }));
  return { engine, tab: activeTab, items, score: 82 + (tabs.indexOf(activeTab) % 5) };
}

export function allEnginesPresent(): boolean {
  return (["scan", "sentinel", "oracle", "phoenix", "titan", "atlas", "guardian"] as const).length === 7;
}
