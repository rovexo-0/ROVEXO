import { getLiveCountriesSnapshot } from "@/lib/analytics/live-countries/service";
import { getPlatformLiveSessions } from "@/lib/analytics/live-countries/platform";
import {
  fetchGa4LiveBrowsers,
  fetchGa4LiveCities,
  fetchGa4LiveDevices,
  fetchGa4LiveOperatingSystems,
  fetchGa4LiveTrafficSources,
  fetchGa4VisitorMetrics,
} from "@/lib/analytics/live-center/ga4-dimensions";
import {
  aggregatePlatformBrowsers,
  aggregatePlatformCities,
  aggregatePlatformDevices,
  aggregatePlatformOperatingSystems,
  aggregatePlatformTrafficSources,
  buildPlatformVisitorMetrics,
} from "@/lib/analytics/live-center/platform-aggregates";
import { getLiveEventFeed } from "@/lib/analytics/live-center/events";
import { getLivePerformanceMetrics } from "@/lib/analytics/live-center/performance";
import type {
  LiveAnalyticsSnapshot,
  LiveAnalyticsSource,
  LiveCountryRow,
  LiveVisitorMetrics,
} from "@/lib/analytics/live-center/types";
import type { LiveCountry } from "@/lib/analytics/live-countries/types";

const CACHE_TTL_MS = 25_000;

let cachedSnapshot: LiveAnalyticsSnapshot | null = null;
let cachedAt = 0;

function withCountryPercentages(countries: LiveCountry[]): LiveCountryRow[] {
  const total = countries.reduce((sum, country) => sum + country.activeUsers, 0) || 1;
  return countries.map((country) => ({
    ...country,
    percentage: Math.round((country.activeUsers / total) * 1000) / 10,
  }));
}

function pickSource(ga4Used: boolean, platformUsed: boolean): LiveAnalyticsSource {
  if (ga4Used && platformUsed) return "hybrid";
  if (ga4Used) return "ga4";
  return "platform";
}

async function buildSnapshot(): Promise<LiveAnalyticsSnapshot> {
  const updatedAt = new Date().toISOString();

  const [
    countriesSnapshot,
    sessions,
    ga4Devices,
    ga4Browsers,
    ga4OperatingSystems,
    ga4TrafficSources,
    ga4Cities,
    ga4VisitorMetrics,
    events,
    performance,
  ] = await Promise.all([
    getLiveCountriesSnapshot(),
    getPlatformLiveSessions(),
    fetchGa4LiveDevices(),
    fetchGa4LiveBrowsers(),
    fetchGa4LiveOperatingSystems(),
    fetchGa4LiveTrafficSources(),
    fetchGa4LiveCities(),
    fetchGa4VisitorMetrics(),
    getLiveEventFeed(),
    getLivePerformanceMetrics(),
  ]);

  const platformMetrics = buildPlatformVisitorMetrics(sessions);
  const visitorMetrics: LiveVisitorMetrics = ga4VisitorMetrics
    ? {
        currentVisitors: ga4VisitorMetrics.activeUsers || platformMetrics.currentVisitors,
        returningVisitors: Math.max(
          0,
          (ga4VisitorMetrics.activeUsers || platformMetrics.currentVisitors) -
            platformMetrics.newVisitors,
        ),
        newVisitors: platformMetrics.newVisitors,
        averageSessionDurationSeconds: platformMetrics.averageSessionDurationSeconds,
        bounceRate: platformMetrics.bounceRate,
        pagesPerSession:
          ga4VisitorMetrics.activeUsers > 0
            ? Math.round((ga4VisitorMetrics.screenPageViews / ga4VisitorMetrics.activeUsers) * 10) /
              10
            : platformMetrics.pagesPerSession,
      }
    : platformMetrics;

  const ga4Used = countriesSnapshot.source === "ga4";
  const devices = ga4Devices ?? aggregatePlatformDevices(sessions);
  const browsers = ga4Browsers ?? aggregatePlatformBrowsers(sessions);
  const operatingSystems = ga4OperatingSystems ?? aggregatePlatformOperatingSystems(sessions);
  const trafficSources = ga4TrafficSources ?? aggregatePlatformTrafficSources(sessions);
  const cities = ga4Cities ?? aggregatePlatformCities(sessions);

  return {
    countries: withCountryPercentages(countriesSnapshot.countries),
    devices,
    browsers,
    operatingSystems,
    trafficSources,
    cities,
    events,
    visitorMetrics,
    performance,
    source: pickSource(ga4Used, sessions.length > 0),
    updatedAt,
  };
}

export async function getLiveAnalyticsCenterSnapshot(): Promise<LiveAnalyticsSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedAt < CACHE_TTL_MS) {
    return cachedSnapshot;
  }

  const snapshot = await buildSnapshot();
  cachedSnapshot = snapshot;
  cachedAt = now;
  return snapshot;
}

export function clearLiveAnalyticsCenterCache(): void {
  cachedSnapshot = null;
  cachedAt = 0;
}
