import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformMobileCcAction } from "@/lib/enterprise-mobile-control-center/audit";
import { getMobileCcLiveDocument, mobileCcConfigLifecycle } from "@/lib/enterprise-mobile-control-center/config";
import { executeMobileCcConfigAction, isMobileCcConfigAction } from "@/lib/enterprise-mobile-control-center/config-actions";
import type { MobileCcConfigDocument } from "@/lib/enterprise-mobile-control-center/config";
import { ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR } from "@/lib/enterprise-mobile-control-center/descriptor";
import { createBuild, isValidBuildType } from "@/lib/enterprise-mobile-control-center/builds";
import { applyDeviceAction, isValidDeviceAction } from "@/lib/enterprise-mobile-control-center/devices";
import { generateDownload, isValidDownloadType } from "@/lib/enterprise-mobile-control-center/downloads";
import { createOtaUpdate, isValidOtaType } from "@/lib/enterprise-mobile-control-center/ota";
import { createPushCampaign, isValidPushType } from "@/lib/enterprise-mobile-control-center/push";
import type { MobileRelease } from "@/lib/enterprise-mobile-control-center/types";

export async function executeMobileCcAction(
  action: string,
  actorId: string,
  payload?: Record<string, unknown>,
) {
  if (isMobileCcConfigAction(action)) {
    return executeMobileCcConfigAction(action, actorId, payload as { document?: MobileCcConfigDocument; historyId?: string });
  }

  const permission = canPerformMobileCcAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getMobileCcLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.id,
    action,
  });

  switch (action) {
    case "build": {
      const buildType = String(payload?.buildType ?? "build-android-aab");
      if (!isValidBuildType(buildType)) throw new Error("Invalid build type");
      const build = createBuild(buildType);
      const next = {
        ...live,
        settings: {
          ...live.settings,
          builds: [build, ...live.settings.builds].slice(0, 50),
          buildHistory: [build, ...live.settings.buildHistory].slice(0, 100),
        },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await mobileCcConfigLifecycle.saveDraft(next, actorId);
      return { build };
    }
    case "publish": {
      const releaseId = String(payload?.releaseId ?? live.settings.releases[0]?.id ?? "");
      const releases = live.settings.releases.map((r) =>
        r.id === releaseId ? { ...r, status: "published" as const, publishedAt: new Date().toISOString() } : r,
      );
      const next = { ...live, settings: { ...live.settings, releases }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) };
      await mobileCcConfigLifecycle.saveDraft(next, actorId);
      return { release: releases.find((r) => r.id === releaseId) };
    }
    case "rollback": {
      const releaseId = String(payload?.releaseId ?? "");
      const releases = live.settings.releases.map((r) =>
        r.id === releaseId ? { ...r, status: "rolled-back" as MobileRelease["status"] } : r,
      );
      const next = { ...live, settings: { ...live.settings, releases }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) };
      await mobileCcConfigLifecycle.saveDraft(next, actorId);
      return { release: releases.find((r) => r.id === releaseId) };
    }
    case "send-push": {
      const pushType = String(payload?.pushType ?? "broadcast");
      if (!isValidPushType(pushType)) throw new Error("Invalid push type");
      const campaign = createPushCampaign(pushType);
      const next = {
        ...live,
        settings: { ...live.settings, pushCampaigns: [campaign, ...live.settings.pushCampaigns].slice(0, 50) },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await mobileCcConfigLifecycle.saveDraft(next, actorId);
      return { campaign };
    }
    case "create-ota": {
      const otaType = String(payload?.otaType ?? "gradual-rollout");
      if (!isValidOtaType(otaType)) throw new Error("Invalid OTA type");
      const ota = createOtaUpdate(otaType, String(payload?.version ?? live.settings.productionVersion));
      const next = {
        ...live,
        settings: { ...live.settings, otaUpdates: [ota, ...live.settings.otaUpdates].slice(0, 50) },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await mobileCcConfigLifecycle.saveDraft(next, actorId);
      return { ota };
    }
    case "remote-logout":
    case "disable-device": {
      const deviceId = String(payload?.deviceId ?? "");
      const deviceAction = action as "remote-logout" | "disable-device";
      if (!isValidDeviceAction(deviceAction)) throw new Error("Invalid device action");
      const devices = live.settings.devices.map((d) =>
        d.id === deviceId ? applyDeviceAction(d, deviceAction) : d,
      );
      const next = { ...live, settings: { ...live.settings, devices }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) };
      await mobileCcConfigLifecycle.saveDraft(next, actorId);
      return { device: devices.find((d) => d.id === deviceId) };
    }
    case "generate-download": {
      const downloadType = String(payload?.downloadType ?? "android-apk");
      if (!isValidDownloadType(downloadType)) throw new Error("Invalid download type");
      const download = generateDownload(downloadType);
      const next = {
        ...live,
        settings: { ...live.settings, downloads: [download, ...live.settings.downloads].slice(0, 50) },
        auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
      };
      await mobileCcConfigLifecycle.saveDraft(next, actorId);
      return { download };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
