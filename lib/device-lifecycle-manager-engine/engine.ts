import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditDeviceLifecycleManagerAction } from "@/lib/device-lifecycle-manager-engine/audit";
import {
  createDefaultDeviceLifecycleAlerts,
  createDefaultDeviceLifecycleHistory,
  createDefaultDeviceLifecycleLogs,
  createDefaultDeviceLifecycleRecords,
  createDefaultDeviceLifecycleSettings,
} from "@/lib/device-lifecycle-manager-engine/defaults";
import {
  DEVICE_LIFECYCLE_MANAGER_ALERTS_KEY,
  DEVICE_LIFECYCLE_MANAGER_HISTORY_KEY,
  DEVICE_LIFECYCLE_MANAGER_LOGS_KEY,
  DEVICE_LIFECYCLE_MANAGER_RECORDS_KEY,
  DEVICE_LIFECYCLE_MANAGER_SETTINGS_KEY,
} from "@/lib/device-lifecycle-manager-engine/keys";
import type {
  DeviceHistoryEvent,
  DeviceLifecycleAlert,
  DeviceLifecycleRecord,
  DeviceLifecycleSettings,
  DeviceLogEntry,
  DeviceRemoteAction,
} from "@/lib/device-lifecycle-manager-engine/types";
import { buildTamperIncident } from "@/lib/device-lifecycle-manager-engine/timeline";

export async function getDeviceLifecycleRecords(): Promise<DeviceLifecycleRecord[]> {
  return getPlatformSetting(DEVICE_LIFECYCLE_MANAGER_RECORDS_KEY, createDefaultDeviceLifecycleRecords());
}

export async function getDeviceLifecycleAlerts(): Promise<DeviceLifecycleAlert[]> {
  return getPlatformSetting(DEVICE_LIFECYCLE_MANAGER_ALERTS_KEY, createDefaultDeviceLifecycleAlerts());
}

export async function getDeviceLifecycleHistory(): Promise<DeviceHistoryEvent[]> {
  return getPlatformSetting(DEVICE_LIFECYCLE_MANAGER_HISTORY_KEY, createDefaultDeviceLifecycleHistory());
}

export async function getDeviceLifecycleLogs(): Promise<DeviceLogEntry[]> {
  return getPlatformSetting(DEVICE_LIFECYCLE_MANAGER_LOGS_KEY, createDefaultDeviceLifecycleLogs());
}

export async function getDeviceLifecycleSettings(): Promise<DeviceLifecycleSettings> {
  return getPlatformSetting(DEVICE_LIFECYCLE_MANAGER_SETTINGS_KEY, createDefaultDeviceLifecycleSettings());
}

async function appendHistory(entry: DeviceHistoryEvent, actorId: string) {
  const history = await getDeviceLifecycleHistory();
  await updatePlatformSetting({
    actorId,
    key: DEVICE_LIFECYCLE_MANAGER_HISTORY_KEY,
    value: [entry, ...history].slice(0, 200) as unknown as Json,
  });
}

async function appendLog(entry: DeviceLogEntry, actorId: string) {
  const logs = await getDeviceLifecycleLogs();
  await updatePlatformSetting({
    actorId,
    key: DEVICE_LIFECYCLE_MANAGER_LOGS_KEY,
    value: [entry, ...logs].slice(0, 200) as unknown as Json,
  });
}

export async function executeDeviceRemoteAction(
  action: DeviceRemoteAction,
  deviceId: string,
  actorId: string,
  payload?: { name?: string },
): Promise<DeviceLifecycleRecord[]> {
  const [devices, settings, alerts] = await Promise.all([
    getDeviceLifecycleRecords(),
    getDeviceLifecycleSettings(),
    getDeviceLifecycleAlerts(),
  ]);
  const index = devices.findIndex((d) => d.id === deviceId);
  if (index < 0) throw new Error("Device not found");

  const device = devices[index]!;
  let next = [...devices];
  let nextAlerts = [...alerts];

  switch (action) {
    case "remote-logout":
      next[index] = {
        ...device,
        registration: { ...device.registration, lastLogin: new Date(0).toISOString() },
      };
      break;
    case "remote-lock":
      next[index] = { ...device, locked: true };
      break;
    case "force-update":
      next[index] = {
        ...device,
        registration: { ...device.registration, appVersion: "1.0.0", buildNumber: "100" },
        trust: { ...device.trust, updateStatus: "Updating", score: Math.min(100, device.trust.score + 10) },
      };
      break;
    case "revoke":
      next[index] = { ...device, trustStatus: "revoked", locked: true, certification: { ...device.certification, trustVerified: false } };
      break;
    case "remove":
      next = next.filter((d) => d.id !== deviceId);
      break;
    case "rename":
      if (!payload?.name) throw new Error("Name required");
      next[index] = { ...device, registration: { ...device.registration, deviceName: payload.name } };
      break;
    case "clear-cache":
      next[index] = { ...device, health: { ...device.health, appPerformance: "Cache cleared" } };
      break;
    case "reset-biometric":
      next[index] = { ...device, trust: { ...device.trust, authenticationHealth: 100 } };
      break;
    case "invalidate-sessions":
      next[index] = {
        ...device,
        registration: { ...device.registration, lastSync: new Date(0).toISOString() },
      };
      break;
    case "trust":
      next[index] = {
        ...device,
        trustStatus: "trusted",
        locked: false,
        trust: { ...device.trust, score: 95, level: "green" },
        certification: { ...device.certification, trustVerified: true },
      };
      break;
    case "generate-report":
      break;
    default:
      throw new Error("Unknown action");
  }

  if (action !== "remove") {
    const updated = next.find((d) => d.id === deviceId);
    if (updated?.tamper.detected && settings.lockOnTamper && !updated.locked) {
      const locked = { ...updated, locked: true };
      next = next.map((d) => (d.id === deviceId ? locked : d));
      if (settings.notifyOmegaOnTamper || settings.notifySentinelOnTamper) {
        nextAlerts = [buildTamperIncident(locked), ...nextAlerts].slice(0, 100);
      }
    }
  }

  await updatePlatformSetting({ actorId, key: DEVICE_LIFECYCLE_MANAGER_RECORDS_KEY, value: next as unknown as Json });
  if (nextAlerts.length !== alerts.length) {
    await updatePlatformSetting({ actorId, key: DEVICE_LIFECYCLE_MANAGER_ALERTS_KEY, value: nextAlerts as unknown as Json });
  }

  await appendHistory(
    {
      id: `hist-${Date.now().toString(36)}`,
      deviceId,
      category: action === "force-update" ? "update" : action.includes("trust") ? "authentication" : "security",
      title: `Remote action: ${action}`,
      detail: `Executed by ${actorId}`,
      timestamp: new Date().toISOString(),
    },
    actorId,
  );

  await appendLog(
    {
      id: `log-${Date.now().toString(36)}`,
      deviceId,
      level: "info",
      source: "Device Lifecycle Manager",
      message: `Remote action "${action}" completed`,
      timestamp: new Date().toISOString(),
    },
    actorId,
  );

  await auditDeviceLifecycleManagerAction({
    actorId,
    module: "device-lifecycle-manager",
    action,
    newValue: { deviceId, name: payload?.name },
  });

  return next;
}

export async function saveDeviceLifecycleSettings(settings: DeviceLifecycleSettings, actorId: string) {
  await updatePlatformSetting({
    actorId,
    key: DEVICE_LIFECYCLE_MANAGER_SETTINGS_KEY,
    value: settings as unknown as Json,
  });
  await auditDeviceLifecycleManagerAction({
    actorId,
    module: "device-lifecycle-manager",
    action: "save-settings",
    newValue: settings,
  });
  return settings;
}
