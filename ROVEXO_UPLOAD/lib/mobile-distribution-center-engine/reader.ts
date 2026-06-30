import {
  getMobileDistributionAnalytics,
  getMobileDistributionCenterEngineSnapshotForAdmin,
  getMobileRegisteredDevices,
  readLiveMobileDistributionCenterEngineDocument,
} from "@/lib/mobile-distribution-center-engine/engine";
import {
  createDefaultMobileCompliance,
  createDefaultMobileNotifications,
  createDefaultMobileVersionReleases,
} from "@/lib/mobile-distribution-center-engine/defaults";
import {
  buildDeviceStats,
  buildLanguageSyncStatus,
  buildOmegaMetrics,
  buildOriAssistant,
  buildQrInstallPayload,
  buildSecurityCenter,
  buildSupportedLanguages,
  buildVersionCenter,
  resolveInstallStatus,
  resolveLiveStatus,
  validatePackageSignature,
  validateQrPayload,
} from "@/lib/mobile-distribution-center-engine/timeline";
import type { MobileDistributionEngineSnapshot } from "@/lib/mobile-distribution-center-engine/types";

export async function getMobileDistributionCenterEngineSnapshot(): Promise<MobileDistributionEngineSnapshot> {
  const [{ draft, live, history }, devices, analytics] = await Promise.all([
    getMobileDistributionCenterEngineSnapshotForAdmin(),
    getMobileRegisteredDevices(),
    getMobileDistributionAnalytics(),
  ]);

  const releases = createDefaultMobileVersionReleases();
  const compliance = createDefaultMobileCompliance();
  const notifications = createDefaultMobileNotifications();
  const qrInstall = buildQrInstallPayload({ config: live });
  const installStatus = resolveInstallStatus(devices, live.appInfo.currentVersion);
  const liveStatus = resolveLiveStatus(devices);
  const omega = buildOmegaMetrics(analytics, live);
  const ori = buildOriAssistant(devices, live);

  return {
    scannedAt: new Date().toISOString(),
    appInfo: live.appInfo,
    downloadLinks: live.downloadLinks,
    installStatus,
    liveStatus,
    security: live.security,
    securityCenter: buildSecurityCenter(live, devices),
    biometric: live.biometric,
    language: live.language,
    languageSync: buildLanguageSyncStatus(live.language),
    supportedLanguages: buildSupportedLanguages(),
    qrInstall,
    qrValid: validateQrPayload(qrInstall, live.appInfo.checksum),
    signatureValid: validatePackageSignature(live),
    deviceStats: buildDeviceStats(devices),
    devices,
    versionCenter: buildVersionCenter(live, releases),
    analytics,
    compliance,
    notifications,
    omega,
    ori,
    integrations: live.integrations,
    draft,
    live,
    configHistory: history,
  };
}

export async function getMobileDistributionCenterPageData() {
  const snapshot = await getMobileDistributionCenterEngineSnapshot();
  return { snapshot };
}

export async function getPublicMobileDistributionCenterEngineConfig() {
  return readLiveMobileDistributionCenterEngineDocument();
}
