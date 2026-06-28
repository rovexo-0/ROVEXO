import type { MobileAnalytics } from "@/lib/enterprise-mobile-control-center/types";
import type { MobileDevice } from "@/lib/enterprise-mobile-control-center/types";

export function buildMobileAnalytics(devices: MobileDevice[]): MobileAnalytics {
  const online = devices.filter((d) => d.online).length;
  return {
    activeInstallations: devices.length + 12,
    dailyActiveDevices: online + 5,
    monthlyActiveDevices: devices.length + 28,
    retention: 0.82,
    crashes: 3,
    avgStartupMs: 420,
    avgSyncMs: 180,
    pushDeliveryRate: 96,
    versionDistribution: devices.reduce<Record<string, number>>((acc, d) => {
      acc[d.appVersion] = (acc[d.appVersion] ?? 0) + 1;
      return acc;
    }, { "2.4.0": 2, "2.3.9": 1 }),
  };
}

export function computeReleaseHealth(analytics: MobileAnalytics): number {
  const crashPenalty = Math.min(analytics.crashes * 5, 30);
  const retentionBonus = Math.round(analytics.retention * 20);
  return Math.max(0, Math.min(100, 80 - crashPenalty + retentionBonus - 16));
}
