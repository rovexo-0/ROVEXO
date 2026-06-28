import type {
  MobileCcDashboard,
  MobileCcSettings,
  MobileCcState,
  MobileRelease,
} from "@/lib/enterprise-mobile-control-center/types";
import { createBuild } from "@/lib/enterprise-mobile-control-center/builds";
import { createDefaultDevices, countOnlineDevices } from "@/lib/enterprise-mobile-control-center/devices";
import { generateDownload } from "@/lib/enterprise-mobile-control-center/downloads";
import { createOtaUpdate } from "@/lib/enterprise-mobile-control-center/ota";
import { createPushCampaign } from "@/lib/enterprise-mobile-control-center/push";
import { buildMobileAnalytics, computeReleaseHealth } from "@/lib/enterprise-mobile-control-center/analytics";
import { generateMobileAiInsights, generateMobileAiSuggestions } from "@/lib/enterprise-mobile-control-center/ai-integration";
import { averagePushDelivery, resolvePushStatus } from "@/lib/enterprise-mobile-control-center/push";
import { countQueuedBuilds } from "@/lib/enterprise-mobile-control-center/builds";

export function createDefaultMobileCcSettings(): MobileCcSettings {
  return {
    productionVersion: "2.4.0",
    betaVersion: "2.4.1-beta",
    internalVersion: "2.4.2-internal",
    otaEnabled: true,
    pushEnabled: true,
    approvalRequiredForPublish: true,
    gradualRolloutDefault: 25,
  };
}

export function createDefaultReleases(): MobileRelease[] {
  return [
    { id: "rel-1", platform: "android", channel: "production", version: "2.4.0", buildNumber: 24000, status: "published", publishedAt: new Date().toISOString(), releaseNotes: "Production release" },
    { id: "rel-2", platform: "ios", channel: "testflight", version: "2.4.0", buildNumber: 24000, status: "published", publishedAt: new Date().toISOString() },
    { id: "rel-3", platform: "android", channel: "beta", version: "2.4.1-beta", buildNumber: 24100, status: "draft" },
  ];
}

export function createDefaultMobileCcState(): MobileCcState {
  const devices = createDefaultDevices();
  const builds = [createBuild("build-android-aab"), createBuild("build-ios"), createBuild("build-testflight")];
  const pushCampaigns = [createPushCampaign("broadcast"), createPushCampaign("update-available")];
  return {
    builds,
    releases: createDefaultReleases(),
    devices,
    downloads: [generateDownload("android-apk"), generateDownload("qr-code")],
    otaUpdates: [createOtaUpdate("gradual-rollout")],
    pushCampaigns,
    buildHistory: builds,
    aiInsights: generateMobileAiInsights(devices, builds),
    aiSuggestions: generateMobileAiSuggestions(devices, builds),
  };
}

export function buildMobileCcDashboard(state: MobileCcState, settings: MobileCcSettings): MobileCcDashboard {
  const analytics = buildMobileAnalytics(state.devices);
  const androidBuild = state.builds.find((b) => b.platform === "android" && b.status === "completed");
  const iosBuild = state.builds.find((b) => b.platform === "ios" && b.status === "completed");
  const pushRate = averagePushDelivery(state.pushCampaigns);
  const activeOta = state.otaUpdates.find((o) => o.status === "rolling-out");

  return {
    androidBuild: androidBuild ? `${androidBuild.version} (${androidBuild.buildNumber})` : settings.productionVersion,
    iosBuild: iosBuild ? `${iosBuild.version} (${iosBuild.buildNumber})` : settings.productionVersion,
    productionVersion: settings.productionVersion,
    betaVersion: settings.betaVersion,
    internalVersion: settings.internalVersion,
    latestRelease: state.releases.find((r) => r.status === "published")?.version ?? settings.productionVersion,
    activeDevices: countOnlineDevices(state.devices),
    installedDevices: state.devices.length,
    crashReports: analytics.crashes,
    pushStatus: resolvePushStatus(pushRate),
    otaStatus: activeOta ? "rolling-out" : "idle",
    buildQueue: countQueuedBuilds(state.builds),
    releaseHealth: computeReleaseHealth(analytics),
  };
}
