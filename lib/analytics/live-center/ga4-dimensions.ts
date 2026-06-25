import type { Ga4RealtimeRow } from "@/lib/analytics/live-countries/ga4-realtime";
import { runGa4RealtimeReport } from "@/lib/analytics/live-countries/ga4-realtime";
import {
  countryCodeToFlag,
  getCountryName,
  normalizeCountryCode,
} from "@/lib/analytics/live-countries/countries";
import {
  cleanGa4Label,
  normalizeBrowser,
  normalizeDeviceCategory,
  normalizeOperatingSystem,
  normalizeTrafficSource,
  withPercentages,
} from "@/lib/analytics/live-center/normalize";
import type { LiveCityRow, LiveDimensionRow } from "@/lib/analytics/live-center/types";

function readActiveUsers(row: Ga4RealtimeRow): number {
  const value = Number.parseInt(row.metricValues?.[0]?.value ?? "0", 10);
  return Number.isFinite(value) ? value : 0;
}

function aggregateRows(
  rows: Ga4RealtimeRow[],
  labelIndex: number,
  normalize: (value: string | null) => string,
): LiveDimensionRow[] {
  const grouped = new Map<string, number>();

  for (const row of rows) {
    const raw = cleanGa4Label(row.dimensionValues?.[labelIndex]?.value);
    const label = normalize(raw);
    const activeUsers = readActiveUsers(row);
    if (!label || activeUsers <= 0) continue;
    grouped.set(label, (grouped.get(label) ?? 0) + activeUsers);
  }

  return withPercentages(
    Array.from(grouped.entries()).map(([label, activeUsers]) => ({
      id: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      activeUsers,
    })),
  );
}

export async function fetchGa4LiveDevices(): Promise<LiveDimensionRow[] | null> {
  const rows = await runGa4RealtimeReport([{ name: "deviceCategory" }]);
  if (!rows) return null;
  return aggregateRows(rows, 0, normalizeDeviceCategory);
}

export async function fetchGa4LiveBrowsers(): Promise<LiveDimensionRow[] | null> {
  const rows = await runGa4RealtimeReport([{ name: "browser" }]);
  if (!rows) return null;
  return aggregateRows(rows, 0, normalizeBrowser);
}

export async function fetchGa4LiveOperatingSystems(): Promise<LiveDimensionRow[] | null> {
  const rows = await runGa4RealtimeReport([{ name: "operatingSystem" }]);
  if (!rows) return null;
  return aggregateRows(rows, 0, normalizeOperatingSystem);
}

export async function fetchGa4LiveTrafficSources(): Promise<LiveDimensionRow[] | null> {
  const rows = await runGa4RealtimeReport([
    { name: "sessionSource" },
    { name: "sessionMedium" },
  ]);
  if (!rows) return null;

  const grouped = new Map<string, number>();
  for (const row of rows) {
    const source = cleanGa4Label(row.dimensionValues?.[0]?.value);
    const medium = cleanGa4Label(row.dimensionValues?.[1]?.value);
    const label = normalizeTrafficSource(source, medium);
    const activeUsers = readActiveUsers(row);
    if (activeUsers <= 0) continue;
    grouped.set(label, (grouped.get(label) ?? 0) + activeUsers);
  }

  return withPercentages(
    Array.from(grouped.entries()).map(([label, activeUsers]) => ({
      id: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      activeUsers,
    })),
  );
}

export async function fetchGa4LiveCities(): Promise<LiveCityRow[] | null> {
  const rows = await runGa4RealtimeReport([
    { name: "city" },
    { name: "countryId" },
    { name: "country" },
  ]);
  if (!rows) return null;

  const grouped = new Map<string, LiveCityRow>();

  for (const row of rows) {
    const city = cleanGa4Label(row.dimensionValues?.[0]?.value);
    const countryCode = normalizeCountryCode(row.dimensionValues?.[1]?.value);
    const countryNameRaw = cleanGa4Label(row.dimensionValues?.[2]?.value);
    const activeUsers = readActiveUsers(row);

    if (!city || !countryCode || activeUsers <= 0) continue;

    const id = `${countryCode}:${city}`.toLowerCase();
    const existing = grouped.get(id);
    if (existing) {
      existing.activeUsers += activeUsers;
      continue;
    }

    grouped.set(id, {
      id,
      name: city,
      countryCode,
      countryName: getCountryName(countryCode, countryNameRaw ?? undefined),
      flag: countryCodeToFlag(countryCode),
      activeUsers,
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

export async function fetchGa4VisitorMetrics(): Promise<{
  screenPageViews: number;
  activeUsers: number;
} | null> {
  const rows = await runGa4RealtimeReport([], [
    { name: "activeUsers" },
    { name: "screenPageViews" },
  ]);
  if (!rows?.length) return null;

  const activeUsers = Number.parseInt(rows[0].metricValues?.[0]?.value ?? "0", 10) || 0;
  const screenPageViews = Number.parseInt(rows[0].metricValues?.[1]?.value ?? "0", 10) || 0;
  return { activeUsers, screenPageViews };
}
