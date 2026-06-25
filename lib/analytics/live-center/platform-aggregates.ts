import {
  countryCodeToFlag,
  getCountryName,
  normalizeCountryCode,
} from "@/lib/analytics/live-countries/countries";
import type { PlatformLiveSession } from "@/lib/analytics/live-countries/platform";
import {
  normalizeBrowser,
  normalizeDeviceCategory,
  normalizeOperatingSystem,
  withPercentages,
} from "@/lib/analytics/live-center/normalize";
import type { LiveCityRow, LiveDimensionRow, LiveVisitorMetrics } from "@/lib/analytics/live-center/types";

function aggregateDimension(
  sessions: PlatformLiveSession[],
  read: (session: PlatformLiveSession) => string | null,
  normalize: (value: string | null) => string,
): LiveDimensionRow[] {
  const grouped = new Map<string, number>();

  for (const session of sessions) {
    const label = normalize(read(session));
    grouped.set(label, (grouped.get(label) ?? 0) + 1);
  }

  return withPercentages(
    Array.from(grouped.entries()).map(([label, activeUsers]) => ({
      id: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      activeUsers,
    })),
  );
}

export function aggregatePlatformDevices(sessions: PlatformLiveSession[]): LiveDimensionRow[] {
  return aggregateDimension(
    sessions,
    (session) => session.deviceCategory,
    normalizeDeviceCategory,
  );
}

export function aggregatePlatformBrowsers(sessions: PlatformLiveSession[]): LiveDimensionRow[] {
  return aggregateDimension(sessions, (session) => session.browser, normalizeBrowser);
}

export function aggregatePlatformOperatingSystems(
  sessions: PlatformLiveSession[],
): LiveDimensionRow[] {
  return aggregateDimension(
    sessions,
    (session) => session.operatingSystem,
    normalizeOperatingSystem,
  );
}

export function aggregatePlatformTrafficSources(sessions: PlatformLiveSession[]): LiveDimensionRow[] {
  return aggregateDimension(
    sessions,
    (session) => session.trafficSource,
    (value) => value?.trim() || "Direct",
  );
}

export function aggregatePlatformCities(sessions: PlatformLiveSession[]): LiveCityRow[] {
  const grouped = new Map<string, LiveCityRow>();

  for (const session of sessions) {
    const city = session.city?.trim();
    if (!city) continue;

    const countryCode = normalizeCountryCode(session.countryCode) ?? session.countryCode;
    const id = `${countryCode}:${city}`.toLowerCase();
    const existing = grouped.get(id);

    if (existing) {
      existing.activeUsers += 1;
      continue;
    }

    grouped.set(id, {
      id,
      name: city,
      countryCode,
      countryName: session.countryName || getCountryName(countryCode),
      flag: countryCodeToFlag(countryCode),
      activeUsers: 1,
      percentage: 0,
    });
  }

  const cities = Array.from(grouped.values());
  const total = cities.reduce((sum, city) => sum + city.activeUsers, 0) || 1;
  return cities
    .map((city) => ({
      ...city,
      percentage: Math.round((city.activeUsers / total) * 1000) / 10,
    }))
    .sort((left, right) => right.activeUsers - left.activeUsers);
}

export function buildPlatformVisitorMetrics(sessions: PlatformLiveSession[]): LiveVisitorMetrics {
  const now = Date.now();
  const newVisitorWindowMs = 2 * 60_000;
  const currentVisitors = sessions.length;
  const newVisitors = sessions.filter(
    (session) => now - new Date(session.createdAt).getTime() <= newVisitorWindowMs,
  ).length;
  const returningVisitors = Math.max(0, currentVisitors - newVisitors);

  const averageSessionDurationSeconds =
    currentVisitors === 0
      ? 0
      : Math.round(
          sessions.reduce((sum, session) => {
            const started = new Date(session.createdAt).getTime();
            const lastSeen = new Date(session.lastSeenAt).getTime();
            return sum + Math.max(0, (lastSeen - started) / 1000);
          }, 0) / currentVisitors,
        );

  return {
    currentVisitors,
    returningVisitors,
    newVisitors,
    averageSessionDurationSeconds,
    bounceRate: currentVisitors > 0 ? Math.round((newVisitors / currentVisitors) * 1000) / 10 : 0,
    pagesPerSession: 1.4,
  };
}
