import { createAdminClient } from "@/lib/supabase/admin";
import {
  countryCodeToFlag,
  getCountryName,
  normalizeCountryCode,
} from "@/lib/analytics/live-countries/countries";
import type { LiveCountry } from "@/lib/analytics/live-countries/types";

export type VisitorPresenceMetadata = {
  city?: string | null;
  deviceCategory?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  trafficSource?: string | null;
};

export type PlatformLiveSession = {
  sessionId: string;
  countryCode: string;
  countryName: string;
  city: string | null;
  deviceCategory: string | null;
  browser: string | null;
  operatingSystem: string | null;
  trafficSource: string | null;
  createdAt: string;
  lastSeenAt: string;
};

const ACTIVE_WINDOW_MS = 5 * 60_000;

function activeCutoffIso(): string {
  return new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();
}

export async function recordVisitorPresence(
  sessionId: string,
  countryCode: string,
  metadata?: VisitorPresenceMetadata,
): Promise<void> {
  const code = normalizeCountryCode(countryCode);
  if (!code || !sessionId.trim()) return;

  const admin = createAdminClient();
  await admin.from("live_visitor_sessions").upsert({
    session_id: sessionId.trim(),
    country_code: code,
    country_name: getCountryName(code),
    city: metadata?.city ?? null,
    device_category: metadata?.deviceCategory ?? null,
    browser: metadata?.browser ?? null,
    operating_system: metadata?.operatingSystem ?? null,
    traffic_source: metadata?.trafficSource ?? null,
    last_seen_at: new Date().toISOString(),
  });
}

export async function getPlatformLiveCountries(): Promise<LiveCountry[]> {
  const admin = createAdminClient();
  const cutoff = activeCutoffIso();

  await admin.from("live_visitor_sessions").delete().lt("last_seen_at", cutoff);

  const { data, error } = await admin
    .from("live_visitor_sessions")
    .select("country_code, country_name")
    .gte("last_seen_at", cutoff);

  if (error) throw error;

  const grouped = new Map<string, { name: string; activeUsers: number }>();

  for (const row of data ?? []) {
    const code = normalizeCountryCode(row.country_code);
    if (!code) continue;

    const existing = grouped.get(code);
    if (existing) {
      existing.activeUsers += 1;
      continue;
    }

    grouped.set(code, {
      name: row.country_name || getCountryName(code),
      activeUsers: 1,
    });
  }

  return Array.from(grouped.entries())
    .map(([code, entry]) => ({
      code,
      name: entry.name,
      flag: countryCodeToFlag(code),
      activeUsers: entry.activeUsers,
    }))
    .sort((left, right) => right.activeUsers - left.activeUsers);
}

export function getRequestCountryCode(request: Request): string | null {
  const headerValue =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country-code");

  return normalizeCountryCode(headerValue);
}

export function getRequestCity(request: Request): string | null {
  const headerValue =
    request.headers.get("x-vercel-ip-city") ??
    request.headers.get("cf-ipcity") ??
    request.headers.get("x-city");

  const cleaned = headerValue?.trim();
  return cleaned ? cleaned.replace(/[<>"'`]/g, "").slice(0, 120) : null;
}

export async function getPlatformLiveSessions(): Promise<PlatformLiveSession[]> {
  const admin = createAdminClient();
  const cutoff = activeCutoffIso();

  await admin.from("live_visitor_sessions").delete().lt("last_seen_at", cutoff);

  const { data, error } = await admin
    .from("live_visitor_sessions")
    .select(
      "session_id, country_code, country_name, city, device_category, browser, operating_system, traffic_source, created_at, last_seen_at",
    )
    .gte("last_seen_at", cutoff);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    sessionId: row.session_id,
    countryCode: normalizeCountryCode(row.country_code) ?? row.country_code,
    countryName: row.country_name || getCountryName(row.country_code),
    city: row.city,
    deviceCategory: row.device_category,
    browser: row.browser,
    operatingSystem: row.operating_system,
    trafficSource: row.traffic_source,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  }));
}
