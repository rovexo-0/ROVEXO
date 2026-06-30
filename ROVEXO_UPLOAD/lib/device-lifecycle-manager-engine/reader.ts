import {
  getDeviceLifecycleAlerts,
  getDeviceLifecycleHistory,
  getDeviceLifecycleLogs,
  getDeviceLifecycleRecords,
  getDeviceLifecycleSettings,
} from "@/lib/device-lifecycle-manager-engine/engine";
import {
  createDefaultDeviceLifecycleIntegrations,
  createDefaultDeviceOriInsights,
} from "@/lib/device-lifecycle-manager-engine/defaults";
import {
  buildDeviceLifecycleDashboard,
  buildOriInsightsForDevice,
  computeFleetSecurityScore,
} from "@/lib/device-lifecycle-manager-engine/timeline";
import type { DeviceLifecycleEngineSnapshot, DeviceOriInsight } from "@/lib/device-lifecycle-manager-engine/types";

const LATEST_APP_VERSION = "1.0.0";

export async function getDeviceLifecycleManagerSnapshot(): Promise<DeviceLifecycleEngineSnapshot> {
  const [devices, alerts, history, logs, settings] = await Promise.all([
    getDeviceLifecycleRecords(),
    getDeviceLifecycleAlerts(),
    getDeviceLifecycleHistory(),
    getDeviceLifecycleLogs(),
    getDeviceLifecycleSettings(),
  ]);

  const dashboard = buildDeviceLifecycleDashboard(devices, alerts, LATEST_APP_VERSION);
  const baseOri = createDefaultDeviceOriInsights();
  const deviceOri = devices.flatMap((d) => buildOriInsightsForDevice(d));
  const oriInsights: DeviceOriInsight[] = [...baseOri, ...deviceOri].slice(0, 12);

  return {
    scannedAt: new Date().toISOString(),
    dashboard,
    devices,
    alerts,
    history,
    logs,
    oriInsights,
    settings,
    integrations: createDefaultDeviceLifecycleIntegrations(),
    latestAppVersion: LATEST_APP_VERSION,
  };
}

export async function getDeviceLifecycleManagerPageData() {
  const snapshot = await getDeviceLifecycleManagerSnapshot();
  return { snapshot, securityScore: computeFleetSecurityScore(snapshot.devices) };
}

export async function getDeviceLifecycleManagerSnapshotForAdmin() {
  return getDeviceLifecycleManagerSnapshot();
}
