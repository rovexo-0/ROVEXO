import type { Product, ProductsPage } from "@/lib/products/types";
import { CAMERA_SEARCH_PERFORMANCE_V1 } from "@/lib/search/camera-search-performance-v1";

const MEMORY_TTL_MS = 60_000;
const SESSION_KEY = "rovexo-camera-corpus-v1";

type CorpusCache = {
  items: Product[];
  expiresAt: number;
};

let memoryCache: CorpusCache | null = null;

function readSessionCache(): Product[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CorpusCache;
    if (!parsed?.items?.length || Date.now() > parsed.expiresAt) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function writeSessionCache(items: Product[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CorpusCache = {
      items,
      expiresAt: Date.now() + MEMORY_TTL_MS,
    };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Quota / private mode — memory cache still applies.
  }
}

/**
 * ONE corpus fetch for Camera Search (+ intelligent memory/session cache).
 * Forbidden: sequential multi-page client pagination.
 */
export async function fetchActiveListingCorpus(signal?: AbortSignal): Promise<Product[]> {
  if (memoryCache && Date.now() < memoryCache.expiresAt) {
    return memoryCache.items;
  }

  const sessionItems = readSessionCache();
  if (sessionItems?.length) {
    memoryCache = { items: sessionItems, expiresAt: Date.now() + MEMORY_TTL_MS };
    return sessionItems;
  }

  const response = await fetch("/api/search/image-corpus", {
    signal,
    cache: "default",
  });
  if (!response.ok) {
    // Fail-safe: single homepage page (still one call, never empty loop of waits).
    const fallback = await fetch("/api/homepage/feed?page=1", { signal, cache: "no-store" });
    if (!fallback.ok) return [];
    const payload = (await fallback.json()) as ProductsPage;
    return payload.items ?? [];
  }

  const payload = (await response.json()) as ProductsPage;
  const items = payload.items ?? [];
  memoryCache = { items, expiresAt: Date.now() + MEMORY_TTL_MS };
  writeSessionCache(items);
  void CAMERA_SEARCH_PERFORMANCE_V1.oneApiCall;
  return items;
}

/** Test helper — not a user-facing reload. */
export function clearImageCorpusCache(): void {
  memoryCache = null;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }
}
