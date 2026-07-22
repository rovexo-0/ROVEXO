/**
 * Search Engine v1.0 automatic cache — Hot / Trending / Recent / Popular.
 * Fail-safe: on miss or error, callers must fall back to database search.
 * Zero admin: no write APIs for manual trending/popular edits.
 */

import { SEARCH_ENGINE_V1 } from "@/lib/search/search-engine-v1";

export type SearchCacheBucket = (typeof SEARCH_ENGINE_V1.cacheBuckets)[number];

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 60_000;
const store = new Map<string, CacheEntry<unknown>>();

function cacheKey(bucket: SearchCacheBucket, key: string): string {
  return `${bucket}:${key}`;
}

export function getSearchCache<T>(
  bucket: SearchCacheBucket,
  key: string,
): T | null {
  const entry = store.get(cacheKey(bucket, key)) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(cacheKey(bucket, key));
    return null;
  }
  return entry.value;
}

export function setSearchCache<T>(
  bucket: SearchCacheBucket,
  key: string,
  value: T,
  ttlMs = DEFAULT_TTL_MS,
): void {
  store.set(cacheKey(bucket, key), {
    value,
    expiresAt: Date.now() + Math.max(1_000, ttlMs),
  });
}

/**
 * Read-through cache with database fail-safe.
 * If cache miss OR loader throws → loader result (or empty on total failure).
 */
export async function withSearchCache<T>(
  bucket: SearchCacheBucket,
  key: string,
  loader: () => Promise<T>,
  options?: { ttlMs?: number; emptyOnError?: T },
): Promise<T> {
  const cached = getSearchCache<T>(bucket, key);
  if (cached != null) return cached;

  try {
    const value = await loader();
    setSearchCache(bucket, key, value, options?.ttlMs);
    return value;
  } catch {
    // Fail-safe: CACHE FAILS → DATABASE SEARCH (caller loader already attempted).
    // Return empty fallback when provided so suggestions never white-screen.
    if (options && "emptyOnError" in options) {
      return options.emptyOnError as T;
    }
    throw new Error("SEARCH_CACHE_AND_LOADER_FAILED");
  }
}

/** Test / hot-reload helper — not an admin ranking control. */
export function clearSearchCache(bucket?: SearchCacheBucket): void {
  if (!bucket) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(`${bucket}:`)) store.delete(key);
  }
}
