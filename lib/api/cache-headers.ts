import { NextResponse } from "next/server";

export type CacheProfile = "public-short" | "public-medium" | "public-long" | "private" | "no-store";

const CACHE_PROFILES: Record<CacheProfile, string> = {
  "public-short": "public, s-maxage=30, stale-while-revalidate=120",
  "public-medium": "public, s-maxage=300, stale-while-revalidate=600",
  "public-long": "public, s-maxage=3600, stale-while-revalidate=86400",
  private: "private, no-cache",
  "no-store": "no-store",
};

export function cacheControlValue(profile: CacheProfile): string {
  return CACHE_PROFILES[profile];
}

export function withCacheProfile(response: NextResponse, profile: CacheProfile): NextResponse {
  response.headers.set("Cache-Control", CACHE_PROFILES[profile]);
  return response;
}

export function jsonWithCache<T>(
  data: T,
  profile: CacheProfile,
  init?: ResponseInit,
): NextResponse<T> {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...Object.fromEntries(new Headers(init?.headers).entries()),
      "Cache-Control": CACHE_PROFILES[profile],
    },
  });
}
