/**
 * Canonical in-process Sendcloud V3 catalog cache (ONE owner).
 * Server-side only. Never browser-cache credentials or authoritative identity.
 */

import "server-only";

import { SENDCLOUD_V3_CATALOG_CACHE_TTL_MS } from "@/lib/shipping/sendcloud/v3-catalog-types-v1";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export function buildSendcloudV3CompatCacheKey(methodIds: number[]): string {
  const sorted = [...new Set(methodIds.filter((id) => Number.isFinite(id) && id > 0))].sort(
    (a, b) => a - b,
  );
  return `compat:v1:${sorted.join(",") || "empty"}`;
}

export function buildSendcloudV3CatalogCacheKey(input: {
  fromCountry: string;
  toCountry: string;
  fromPostal: string;
  toPostal: string;
  parcelTier: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  carrierCode?: string;
}): string {
  const postal = (p: string) => p.replace(/\s+/g, "").toUpperCase();
  return [
    "catalog:v1",
    input.fromCountry.toUpperCase(),
    input.toCountry.toUpperCase(),
    postal(input.fromPostal),
    postal(input.toPostal),
    input.parcelTier,
    input.weightKg.toFixed(3),
    `${input.lengthCm}x${input.widthCm}x${input.heightCm}`,
    (input.carrierCode ?? "*").toLowerCase(),
  ].join(":");
}

/**
 * Cache-aside with concurrent request dedupe for identical keys.
 * Stale entries are never returned as fresh.
 */
export async function withSendcloudV3CatalogCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = SENDCLOUD_V3_CATALOG_CACHE_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const hit = cacheStore.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = (async () => {
    const value = await fetcher();
    cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}

/** Test-only: clear cache + inflight. */
export function clearSendcloudV3CatalogCacheForTests(): void {
  cacheStore.clear();
  inflight.clear();
}

/** Test-only introspection. */
export function getSendcloudV3CatalogCacheSizeForTests(): number {
  return cacheStore.size;
}
