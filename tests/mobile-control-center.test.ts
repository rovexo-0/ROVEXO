import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { generateMobileAiInsights, generateMobileAiSuggestions } from "@/lib/enterprise-mobile-control-center/ai-integration";
import { buildMobileAnalytics, computeReleaseHealth } from "@/lib/enterprise-mobile-control-center/analytics";
import { canPerformMobileCcAction, createMobileCcAuditEntry, requiresMfaForMobileCc } from "@/lib/enterprise-mobile-control-center/audit";
import {
  createBuild,
  filterBuildsByPlatform,
  isAndroidBuild,
  isIosBuild,
  isValidBuildType,
  listAndroidBuildTypes,
  listIosBuildTypes,
} from "@/lib/enterprise-mobile-control-center/builds";
import { isMobileCcConfigAction } from "@/lib/enterprise-mobile-control-center/config-actions";
import { ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR } from "@/lib/enterprise-mobile-control-center/descriptor";
import {
  applyDeviceAction,
  countOnlineDevices,
  createDefaultDevices,
  isValidDeviceAction,
} from "@/lib/enterprise-mobile-control-center/devices";
import { generateDownload, isValidDownloadType, listDownloadTypes } from "@/lib/enterprise-mobile-control-center/downloads";
import {
  buildMobileCcDashboard,
  createDefaultMobileCcSettings,
  createDefaultMobileCcState,
} from "@/lib/enterprise-mobile-control-center/engine";
import { computeMobileCcHealth } from "@/lib/enterprise-mobile-control-center/health";
import {
  activeOtaUpdates,
  createOtaUpdate,
  isValidOtaType,
  listOtaTypes,
  rollbackOtaUpdate,
} from "@/lib/enterprise-mobile-control-center/ota";
import {
  averagePushDelivery,
  createPushCampaign,
  isValidPushType,
  listPushTypes,
  resolvePushStatus,
} from "@/lib/enterprise-mobile-control-center/push";
import {
  MOBILE_CC_API,
  MOBILE_CC_ROUTES,
  UNIQUE_BUILD_TYPES,
  PUSH_TYPES,
  OTA_ROLLOUT_TYPES,
  DEVICE_ACTIONS,
  MOBILE_AI_MONITOR_TYPES,
} from "@/lib/enterprise-mobile-control-center/registry";
import { validateMobileCcReadiness } from "@/lib/enterprise-mobile-control-center/reader";
import type { MobileCcSnapshot } from "@/lib/enterprise-mobile-control-center/types";

function sampleSnapshot(overrides: Partial<MobileCcSnapshot> = {}): MobileCcSnapshot {
  const state = createDefaultMobileCcState();
  const settings = createDefaultMobileCcSettings();
  return {
    tab: "dashboard",
    dashboard: buildMobileCcDashboard(state, settings),
    analytics: buildMobileAnalytics(state.devices),
    builds: state.builds,
    releases: state.releases,
    devices: state.devices,
    downloads: state.downloads,
    otaUpdates: state.otaUpdates,
    pushCampaigns: state.pushCampaigns,
    buildHistory: state.buildHistory,
    aiInsights: state.aiInsights,
    aiSuggestions: state.aiSuggestions,
    history: [],
    auditLog: [],
    featureFlags: {
      mobile_cc_enabled: true,
      android_builds_enabled: true,
      ios_builds_enabled: true,
      ota_updates_enabled: true,
      push_center_enabled: true,
      device_management_enabled: true,
      ai_monitoring_enabled: true,
      approval_workflow_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: 85, message: "ok" },
    ...overrides,
  };
}

describe("mobile control center descriptor", () => {
  it("registers module id", () => {
    expect(ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.id).toBe("enterprise-mobile-control-center");
  });

  it("auto registers", () => {
    expect(ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/mobile");
  });

  it("includes eight feature flags", () => {
    expect(ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.featureFlags).toHaveLength(8);
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-mobile-control-center")?.id).toBe("enterprise-mobile-control-center");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-mobile-control-center")?.moduleId).toBe("enterprise-mobile-control-center");
  });
});

describe("mobile control center routes", () => {
  it("defines eight routes", () => {
    expect(MOBILE_CC_ROUTES).toHaveLength(8);
  });

  it("includes build center route", () => {
    expect(MOBILE_CC_ROUTES.find((r) => r.id === "builds")?.href).toBe("/super-admin/mobile/builds");
  });

  it("includes device management route", () => {
    expect(MOBILE_CC_ROUTES.find((r) => r.id === "devices")?.href).toBe("/super-admin/mobile/devices");
  });
});

describe("android builds", () => {
  it("lists android build types", () => {
    expect(listAndroidBuildTypes().every(isAndroidBuild)).toBe(true);
  });

  it("creates android aab build", () => {
    const build = createBuild("build-android-aab");
    expect(build.platform).toBe("android");
    expect(build.status).toBe("completed");
  });

  it("creates apk build", () => {
    const build = createBuild("build-apk");
    expect(build.platform).toBe("android");
  });

  it("validates build type", () => {
    expect(isValidBuildType("build-android")).toBe(true);
    expect(isValidBuildType("invalid")).toBe(false);
  });

  it("filters android builds", () => {
    const builds = [createBuild("build-apk"), createBuild("build-ios")];
    expect(filterBuildsByPlatform(builds, "android")).toHaveLength(1);
  });
});

describe("ios builds", () => {
  it("lists ios build types", () => {
    expect(listIosBuildTypes().every(isIosBuild)).toBe(true);
  });

  it("creates testflight build", () => {
    const build = createBuild("build-testflight");
    expect(build.platform).toBe("ios");
  });

  it("creates ios build", () => {
    const build = createBuild("build-ios");
    expect(build.platform).toBe("ios");
  });

  it("covers unique build types", () => {
    expect(UNIQUE_BUILD_TYPES.length).toBe(9);
  });
});

describe("downloads", () => {
  it("lists download types", () => {
    expect(listDownloadTypes().length).toBe(6);
  });

  it("generates android apk download", () => {
    const dl = generateDownload("android-apk");
    expect(dl.type).toBe("android-apk");
    expect(dl.url).toContain("releases.rovexo.app");
  });

  it("generates qr code download", () => {
    const dl = generateDownload("qr-code");
    expect(dl.qrCode).toBeDefined();
  });

  it("validates download type", () => {
    expect(isValidDownloadType("android-aab")).toBe(true);
    expect(isValidDownloadType("bad")).toBe(false);
  });
});

describe("device management", () => {
  it("creates default devices", () => {
    expect(createDefaultDevices().length).toBeGreaterThan(0);
  });

  it("counts online devices", () => {
    const devices = createDefaultDevices();
    expect(countOnlineDevices(devices)).toBeGreaterThan(0);
  });

  it("applies remote logout", () => {
    const device = createDefaultDevices()[0]!;
    const updated = applyDeviceAction(device, "remote-logout");
    expect(updated.online).toBe(false);
  });

  it("applies disable device", () => {
    const device = createDefaultDevices()[0]!;
    const updated = applyDeviceAction(device, "disable-device");
    expect(updated.securityStatus).toBe("blocked");
  });

  it("validates device actions", () => {
    expect(isValidDeviceAction("force-sync")).toBe(true);
    expect(DEVICE_ACTIONS).toHaveLength(5);
  });
});

describe("ota updates", () => {
  it("lists ota types", () => {
    expect(listOtaTypes()).toEqual([...OTA_ROLLOUT_TYPES]);
  });

  it("creates gradual rollout", () => {
    const ota = createOtaUpdate("gradual-rollout");
    expect(ota.status).toBe("rolling-out");
    expect(ota.rolloutPercent).toBe(10);
  });

  it("creates emergency update", () => {
    const ota = createOtaUpdate("emergency-update");
    expect(ota.rolloutPercent).toBe(100);
  });

  it("rolls back ota", () => {
    const rolled = rollbackOtaUpdate(createOtaUpdate("gradual-rollout"));
    expect(rolled.status).toBe("rolled-back");
  });

  it("finds active ota updates", () => {
    const active = activeOtaUpdates([createOtaUpdate("gradual-rollout")]);
    expect(active).toHaveLength(1);
  });

  it("validates ota type", () => {
    expect(isValidOtaType("staged-rollout")).toBe(true);
  });
});

describe("push center", () => {
  it("lists push types", () => {
    expect(listPushTypes()).toEqual([...PUSH_TYPES]);
  });

  it("creates broadcast push", () => {
    const campaign = createPushCampaign("broadcast");
    expect(campaign.status).toBe("sent");
    expect(campaign.deliveryRate).toBeGreaterThan(0.9);
  });

  it("creates emergency alert", () => {
    const campaign = createPushCampaign("emergency-alert");
    expect(campaign.title).toContain("Emergency");
  });

  it("computes average delivery", () => {
    const rate = averagePushDelivery([createPushCampaign("broadcast")]);
    expect(rate).toBeGreaterThan(90);
  });

  it("resolves push status", () => {
    expect(resolvePushStatus(95)).toBe("healthy");
    expect(resolvePushStatus(60)).toBe("offline");
  });

  it("validates push type", () => {
    expect(isValidPushType("maintenance-alert")).toBe(true);
  });
});

describe("analytics and dashboard", () => {
  it("builds mobile analytics", () => {
    const analytics = buildMobileAnalytics(createDefaultDevices());
    expect(analytics.dailyActiveDevices).toBeGreaterThan(0);
    expect(analytics.retention).toBeGreaterThan(0);
  });

  it("computes release health", () => {
    const analytics = buildMobileAnalytics(createDefaultDevices());
    expect(computeReleaseHealth(analytics)).toBeGreaterThan(0);
  });

  it("builds dashboard", () => {
    const state = createDefaultMobileCcState();
    const dashboard = buildMobileCcDashboard(state, createDefaultMobileCcSettings());
    expect(dashboard.androidBuild).toBeTruthy();
    expect(dashboard.iosBuild).toBeTruthy();
    expect(dashboard.productionVersion).toBe("2.4.0");
  });
});

describe("ai integration", () => {
  it("generates ai insights", () => {
    const state = createDefaultMobileCcState();
    const insights = generateMobileAiInsights(state.devices, state.builds);
    expect(insights).toHaveLength(MOBILE_AI_MONITOR_TYPES.length);
  });

  it("generates ai suggestions", () => {
    const state = createDefaultMobileCcState();
    const suggestions = generateMobileAiSuggestions(state.devices, state.builds);
    expect(suggestions.length).toBeGreaterThan(0);
  });
});

describe("permissions and audit", () => {
  it("allows view for super admin", () => {
    expect(canPerformMobileCcAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires mfa for publish", () => {
    expect(canPerformMobileCcAction({ action: "publish", mfaVerified: false }).allowed).toBe(false);
    expect(canPerformMobileCcAction({ action: "publish", mfaVerified: true }).allowed).toBe(true);
  });

  it("requires mfa for disable device", () => {
    expect(canPerformMobileCcAction({ action: "disable-device", mfaVerified: false }).allowed).toBe(false);
  });

  it("flags mfa audit actions", () => {
    expect(requiresMfaForMobileCc("publish")).toBe(true);
    expect(requiresMfaForMobileCc("build")).toBe(false);
  });

  it("creates audit entry", () => {
    const entry = createMobileCcAuditEntry("build", "admin", "android-aab");
    expect(entry.action).toBe("build");
  });
});

describe("config lifecycle", () => {
  it("recognizes config actions", () => {
    expect(isMobileCcConfigAction("publish-config")).toBe(true);
    expect(isMobileCcConfigAction("build")).toBe(false);
  });

  it("exposes config keys", () => {
    expect(ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.configKeys.draft).toBe("enterprise_mobile_cc_draft_v1");
  });
});

describe("api registry", () => {
  it("defines snapshot endpoint", () => {
    expect(MOBILE_CC_API.snapshot).toBe("/api/super-admin/mobile");
  });

  it("defines build endpoint", () => {
    expect(MOBILE_CC_API.build).toBe("/api/super-admin/mobile/build");
  });

  it("defines device endpoints", () => {
    expect(MOBILE_CC_API.remoteLogout).toBe("/api/super-admin/mobile/remote-logout");
    expect(MOBILE_CC_API.disableDevice).toBe("/api/super-admin/mobile/disable-device");
  });
});

describe("health and readiness", () => {
  it("computes health when enabled", () => {
    const health = computeMobileCcHealth(sampleSnapshot());
    expect(health.score).toBeGreaterThan(0);
  });

  it("reports failed when disabled", () => {
    const health = computeMobileCcHealth(sampleSnapshot({
      featureFlags: { ...sampleSnapshot().featureFlags, mobile_cc_enabled: false },
    }));
    expect(health.status).toBe("failed");
  });

  it("validates readiness", () => {
    const readiness = validateMobileCcReadiness(sampleSnapshot());
    expect(readiness.ready).toBe(true);
  });
});

describe("workflow and enterprise registration", () => {
  it("links to enterprise ai os", () => {
    expect(ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-ai-operating-system");
  });

  it("links to certification center", () => {
    expect(ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.relatedModules).toContain("certification-center");
  });

  it("has build and publish permissions", () => {
    const actions = ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.permissions.map((p) => p.action);
    expect(actions).toContain("build");
    expect(actions).toContain("publish");
    expect(actions).toContain("create-ota");
    expect(actions).toContain("send-push");
  });
});

describe("security", () => {
  it("blocks disabled devices", () => {
    const device = applyDeviceAction(createDefaultDevices()[0]!, "disable-device");
    expect(device.securityStatus).toBe("blocked");
  });

  it("locks session on device", () => {
    const device = applyDeviceAction(createDefaultDevices()[0]!, "lock-session");
    expect(device.securityStatus).toBe("warning");
  });
});
