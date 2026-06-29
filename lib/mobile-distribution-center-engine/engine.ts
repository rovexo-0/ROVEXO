import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import {
  auditMobileDistributionCenterEngineAction,
  createMobileDistributionCenterEngineAuditEntry,
} from "@/lib/mobile-distribution-center-engine/audit";
import {
  createDefaultMobileDistributionAnalytics,
  createDefaultMobileDistributionCenterEngineDocument,
  createDefaultMobileDistributionCenterEngineHistory,
  createDefaultMobileRegisteredDevices,
} from "@/lib/mobile-distribution-center-engine/defaults";
import {
  MOBILE_DISTRIBUTION_CENTER_ANALYTICS_KEY,
  MOBILE_DISTRIBUTION_CENTER_DEVICES_KEY,
  MOBILE_DISTRIBUTION_CENTER_ENGINE_DRAFT_KEY,
  MOBILE_DISTRIBUTION_CENTER_ENGINE_HISTORY_KEY,
  MOBILE_DISTRIBUTION_CENTER_ENGINE_LIVE_KEY,
} from "@/lib/mobile-distribution-center-engine/keys";
import type {
  MobileDistributionEngineDocument,
  MobileDistributionEngineHistoryEntry,
  MobileDistributionLanguage,
  MobileRegisteredDevice,
} from "@/lib/mobile-distribution-center-engine/types";

function normalizeDocument(doc: MobileDistributionEngineDocument): MobileDistributionEngineDocument {
  const defaults = createDefaultMobileDistributionCenterEngineDocument(doc.label);
  const legacyBio = doc.biometric as MobileDistributionEngineDocument["biometric"] & {
    requireForPayments?: boolean;
    requireForRoleChange?: boolean;
  };
  return {
    ...defaults,
    ...doc,
    appInfo: { ...defaults.appInfo, ...doc.appInfo },
    downloadLinks: { ...defaults.downloadLinks, ...doc.downloadLinks },
    biometric: {
      ...defaults.biometric,
      ...doc.biometric,
      requireForPermissions: doc.biometric?.requireForPermissions ?? legacyBio.requireForRoleChange ?? defaults.biometric.requireForPermissions,
      requireForOmegaControls: doc.biometric?.requireForOmegaControls ?? legacyBio.requireForPayments ?? defaults.biometric.requireForOmegaControls,
    },
    security: { ...defaults.security, ...doc.security },
    integrations: { ...defaults.integrations, ...doc.integrations },
    futureReady: doc.futureReady ?? [],
    auditLog: doc.auditLog ?? [],
  };
}

export async function readLiveMobileDistributionCenterEngineDocument(): Promise<MobileDistributionEngineDocument> {
  const doc = await getPlatformSetting<MobileDistributionEngineDocument>(
    MOBILE_DISTRIBUTION_CENTER_ENGINE_LIVE_KEY,
    createDefaultMobileDistributionCenterEngineDocument("Live"),
  );
  return normalizeDocument(doc);
}

export async function getMobileDistributionCenterEngineDraft(): Promise<MobileDistributionEngineDocument> {
  const live = await readLiveMobileDistributionCenterEngineDocument();
  const draft = await getPlatformSetting<MobileDistributionEngineDocument>(MOBILE_DISTRIBUTION_CENTER_ENGINE_DRAFT_KEY, live);
  return normalizeDocument({ ...draft, label: draft.label === "Live" ? "Draft" : draft.label });
}

export async function getMobileDistributionCenterEngineHistory(): Promise<MobileDistributionEngineHistoryEntry[]> {
  return getPlatformSetting(MOBILE_DISTRIBUTION_CENTER_ENGINE_HISTORY_KEY, createDefaultMobileDistributionCenterEngineHistory());
}

export async function getMobileDistributionCenterEngineSnapshotForAdmin() {
  const [draft, live, history] = await Promise.all([
    getMobileDistributionCenterEngineDraft(),
    readLiveMobileDistributionCenterEngineDocument(),
    getMobileDistributionCenterEngineHistory(),
  ]);
  return { draft, live, history };
}

export async function getMobileRegisteredDevices(): Promise<MobileRegisteredDevice[]> {
  return getPlatformSetting<MobileRegisteredDevice[]>(MOBILE_DISTRIBUTION_CENTER_DEVICES_KEY, createDefaultMobileRegisteredDevices());
}

export async function getMobileDistributionAnalytics() {
  return getPlatformSetting(MOBILE_DISTRIBUTION_CENTER_ANALYTICS_KEY, createDefaultMobileDistributionAnalytics());
}

export async function removeMobileDevice(deviceId: string, actorId: string): Promise<MobileRegisteredDevice[]> {
  const devices = await getMobileRegisteredDevices();
  const device = devices.find((d) => d.id === deviceId);
  if (!device) throw new Error("Device not found");

  const next = devices.filter((d) => d.id !== deviceId);
  await updatePlatformSetting({
    actorId,
    key: MOBILE_DISTRIBUTION_CENTER_DEVICES_KEY,
    value: next as unknown as Json,
  });

  await auditMobileDistributionCenterEngineAction({
    actorId,
    module: "mobile-distribution-center",
    action: "remove-device",
    previousValue: { id: deviceId, name: device.name },
  });

  return next;
}

export async function renameMobileDevice(deviceId: string, name: string, actorId: string): Promise<MobileRegisteredDevice[]> {
  const devices = await getMobileRegisteredDevices();
  const index = devices.findIndex((d) => d.id === deviceId);
  if (index < 0) throw new Error("Device not found");

  const previous = devices[index]!.name;
  const next = devices.map((d) => (d.id === deviceId ? { ...d, name } : d));
  await updatePlatformSetting({
    actorId,
    key: MOBILE_DISTRIBUTION_CENTER_DEVICES_KEY,
    value: next as unknown as Json,
  });

  await auditMobileDistributionCenterEngineAction({
    actorId,
    module: "mobile-distribution-center",
    action: "rename-device",
    previousValue: { id: deviceId, name: previous },
    newValue: { id: deviceId, name },
  });

  return next;
}

export async function remoteLogoutMobileDevice(deviceId: string, actorId: string): Promise<MobileRegisteredDevice[]> {
  const devices = await getMobileRegisteredDevices();
  const device = devices.find((d) => d.id === deviceId);
  if (!device) throw new Error("Device not found");

  const next = devices.map((d) =>
    d.id === deviceId ? { ...d, lastLogin: new Date(0).toISOString(), liveStatus: "offline" as const } : d,
  );
  await updatePlatformSetting({
    actorId,
    key: MOBILE_DISTRIBUTION_CENTER_DEVICES_KEY,
    value: next as unknown as Json,
  });

  await auditMobileDistributionCenterEngineAction({
    actorId,
    module: "mobile-distribution-center",
    action: "remote-logout",
    newValue: { id: deviceId },
  });

  return next;
}

export async function blockMobileDevice(deviceId: string, actorId: string): Promise<MobileRegisteredDevice[]> {
  const devices = await getMobileRegisteredDevices();
  const device = devices.find((d) => d.id === deviceId);
  if (!device) throw new Error("Device not found");

  const next = devices.map((d) =>
    d.id === deviceId
      ? { ...d, trustStatus: "blocked" as const, isActive: false, liveStatus: "offline" as const, trustScore: 0 }
      : d,
  );
  await updatePlatformSetting({ actorId, key: MOBILE_DISTRIBUTION_CENTER_DEVICES_KEY, value: next as unknown as Json });
  await auditMobileDistributionCenterEngineAction({
    actorId,
    module: "mobile-distribution-center",
    action: "block-device",
    newValue: { id: deviceId },
  });
  return next;
}

export async function trustMobileDevice(deviceId: string, actorId: string): Promise<MobileRegisteredDevice[]> {
  const devices = await getMobileRegisteredDevices();
  const device = devices.find((d) => d.id === deviceId);
  if (!device) throw new Error("Device not found");

  const next = devices.map((d) =>
    d.id === deviceId ? { ...d, trustStatus: "trusted" as const, isActive: true, trustScore: 95 } : d,
  );
  await updatePlatformSetting({ actorId, key: MOBILE_DISTRIBUTION_CENTER_DEVICES_KEY, value: next as unknown as Json });
  await auditMobileDistributionCenterEngineAction({
    actorId,
    module: "mobile-distribution-center",
    action: "trust-device",
    newValue: { id: deviceId },
  });
  return next;
}

export async function setMobileDistributionLanguage(language: MobileDistributionLanguage, actorId: string): Promise<MobileDistributionEngineDocument> {
  const live = await readLiveMobileDistributionCenterEngineDocument();
  const previous = live.language;
  const next = normalizeDocument({ ...live, language, updatedAt: new Date().toISOString() });

  await updatePlatformSetting({
    actorId,
    key: MOBILE_DISTRIBUTION_CENTER_ENGINE_LIVE_KEY,
    value: next as unknown as Json,
  });

  await auditMobileDistributionCenterEngineAction({
    actorId,
    module: "mobile-distribution-center",
    action: "switch-language",
    previousValue: previous,
    newValue: language,
  });

  return next;
}

export async function saveMobileDistributionCenterDraft(doc: MobileDistributionEngineDocument, actorId: string) {
  const normalized = normalizeDocument({ ...doc, label: "Draft", updatedAt: new Date().toISOString() });
  await updatePlatformSetting({
    actorId,
    key: MOBILE_DISTRIBUTION_CENTER_ENGINE_DRAFT_KEY,
    value: normalized as unknown as Json,
  });
  await auditMobileDistributionCenterEngineAction({
    actorId,
    module: "mobile-distribution-center",
    action: "save-draft",
    newValue: { version: normalized.appInfo.currentVersion },
  });
  return normalized;
}

export async function publishMobileDistributionCenterEngine(actorId: string) {
  const draft = await getMobileDistributionCenterEngineDraft();
  const history = await getMobileDistributionCenterEngineHistory();
  const published = normalizeDocument({ ...draft, label: "Live", updatedAt: new Date().toISOString() });

  await updatePlatformSetting({ actorId, key: MOBILE_DISTRIBUTION_CENTER_ENGINE_LIVE_KEY, value: published as unknown as Json });
  await updatePlatformSetting({
    actorId,
    key: MOBILE_DISTRIBUTION_CENTER_ENGINE_HISTORY_KEY,
    value: [
      {
        id: `mdc-pub-${Date.now().toString(36)}`,
        version: published.appInfo.currentVersion,
        publishedAt: new Date().toISOString(),
        publishedBy: actorId,
        summary: `Published mobile distribution v${published.appInfo.currentVersion}`,
      },
      ...history,
    ].slice(0, 50) as unknown as Json,
  });

  const auditEntry = createMobileDistributionCenterEngineAuditEntry({
    administrator: actorId,
    module: "mobile-distribution-center",
    action: "publish",
    newValue: { version: published.appInfo.currentVersion },
  });
  published.auditLog = [auditEntry, ...published.auditLog].slice(0, 100);

  await auditMobileDistributionCenterEngineAction({
    actorId,
    module: "mobile-distribution-center",
    action: "publish",
    newValue: { version: published.appInfo.currentVersion },
  });

  return published;
}
