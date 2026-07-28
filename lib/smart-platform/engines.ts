/**
 * ROVEXO Global Smart Platform Engine v1.0 — sub-engine registry.
 * Every sub-engine is PRODUCTION_READY and ACTIVE=false until platform cutover.
 */

import {
  SMART_PLATFORM_ENGINE_ACTIVE,
  SMART_PLATFORM_PRODUCTION_READY,
  SMART_PLATFORM_SUB_ENGINES,
  type SmartPlatformSubEngine,
} from "@/lib/smart-platform/constants";
import { isSmartPlatformProductionActive } from "@/lib/smart-platform/mode";

export type SmartSubEngineStatus = {
  id: SmartPlatformSubEngine;
  name: string;
  productionReady: boolean;
  active: boolean;
};

const SUB_ENGINE_NAMES: Record<SmartPlatformSubEngine, string> = {
  visibility: "SMART VISIBILITY ENGINE",
  verified: "SMART VERIFIED ENGINE",
  money: "SMART MONEY ENGINE",
  security: "SMART SECURITY ENGINE",
  business: "SMART BUSINESS ENGINE",
  payment: "SMART PAYMENT ENGINE",
  profile: "SMART PROFILE ENGINE",
  settings: "SMART SETTINGS ENGINE",
  wallet: "SMART WALLET ENGINE",
  feature: "SMART FEATURE ENGINE",
};

/** Snapshot of all sub-engines (ready, inactive until platform activation). */
export function listSmartPlatformEngines(): SmartSubEngineStatus[] {
  const active = isSmartPlatformProductionActive();
  return SMART_PLATFORM_SUB_ENGINES.map((id) => ({
    id,
    name: SUB_ENGINE_NAMES[id],
    productionReady: SMART_PLATFORM_PRODUCTION_READY,
    active,
  }));
}

export function getSmartSubEngineStatus(id: SmartPlatformSubEngine): SmartSubEngineStatus {
  return {
    id,
    name: SUB_ENGINE_NAMES[id],
    productionReady: SMART_PLATFORM_PRODUCTION_READY,
    active: isSmartPlatformProductionActive(),
  };
}

export function getSmartPlatformEngineSnapshot() {
  return {
    name: "ROVEXO GLOBAL SMART PLATFORM ENGINE",
    version: "v1.0",
    productionReady: SMART_PLATFORM_PRODUCTION_READY,
    active: SMART_PLATFORM_ENGINE_ACTIVE,
    engines: listSmartPlatformEngines(),
  };
}
