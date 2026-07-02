import type { OtaRolloutType, OtaUpdate } from "@/lib/enterprise-mobile-control-center/types";
import { OTA_ROLLOUT_TYPES } from "@/lib/enterprise-mobile-control-center/registry";

export function isValidOtaType(type: string): type is OtaRolloutType {
  return (OTA_ROLLOUT_TYPES as readonly string[]).includes(type);
}

export function createOtaUpdate(type: OtaRolloutType, version = "2.4.1"): OtaUpdate {
  return {
    id: `ota-${Date.now()}`,
    type,
    version,
    status: type === "rollback" ? "rolled-back" : "rolling-out",
    rolloutPercent: type === "gradual-rollout" ? 10 : type === "emergency-update" ? 100 : 25,
    createdAt: new Date().toISOString(),
  };
}

export function listOtaTypes(): OtaRolloutType[] {
  return [...OTA_ROLLOUT_TYPES];
}

export function activeOtaUpdates(updates: OtaUpdate[]): OtaUpdate[] {
  return updates.filter((u) => u.status === "rolling-out");
}

export function completeOtaUpdate(update: OtaUpdate): OtaUpdate {
  return { ...update, status: "completed", rolloutPercent: 100 };
}

export function rollbackOtaUpdate(update: OtaUpdate): OtaUpdate {
  return { ...update, status: "rolled-back", rolloutPercent: 0 };
}
