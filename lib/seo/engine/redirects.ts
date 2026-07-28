import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { SeoRedirect } from "@/lib/seo/engine/types";

const CACHE_TTL_MS = 5 * 60 * 1000;
/** Never block Edge middleware on an unbounded SEO DB round-trip. */
const LOAD_BUDGET_MS = 80;

type RedirectCache = {
  expiresAt: number;
  bySource: Map<string, SeoRedirect>;
};

let redirectCache: RedirectCache | null = null;
let warmInflight: Promise<void> | null = null;

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "/";
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.replace(/\/+$/, "") || "/";
}

async function fetchRedirectMap(): Promise<Map<string, SeoRedirect>> {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return redirectCache?.bySource ?? new Map();
  }

  const { data } = await admin
    .from("seo_redirects")
    .select("source_path, target_path, status_code")
    .eq("active", true);

  const bySource = new Map<string, SeoRedirect>();
  for (const row of data ?? []) {
    bySource.set(normalizePath(row.source_path), {
      sourcePath: normalizePath(row.source_path),
      targetPath: row.target_path,
      statusCode: row.status_code,
    });
  }

  redirectCache = { expiresAt: Date.now() + CACHE_TTL_MS, bySource };
  return bySource;
}

function warmRedirectCache(): void {
  if (warmInflight) return;
  warmInflight = fetchRedirectMap()
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      warmInflight = null;
    });
}

/**
 * Stale-while-revalidate for middleware: never await an unbounded DB call on
 * the navigation critical path. Cold cache returns empty map instantly and
 * warms in the background; warm cache is served within LOAD_BUDGET_MS.
 */
async function loadRedirectMap(): Promise<Map<string, SeoRedirect>> {
  if (redirectCache && redirectCache.expiresAt > Date.now()) {
    return redirectCache.bySource;
  }

  if (redirectCache) {
    warmRedirectCache();
    return redirectCache.bySource;
  }

  try {
    const bySource = await Promise.race([
      fetchRedirectMap(),
      new Promise<Map<string, SeoRedirect>>((resolve) => {
        setTimeout(() => {
          warmRedirectCache();
          resolve(new Map());
        }, LOAD_BUDGET_MS);
      }),
    ]);
    return bySource;
  } catch {
    warmRedirectCache();
    return new Map();
  }
}

export async function getSeoRedirect(pathname: string): Promise<SeoRedirect | null> {
  const map = await loadRedirectMap();
  return map.get(normalizePath(pathname)) ?? null;
}

export function invalidateSeoRedirectCache(): void {
  redirectCache = null;
}

export async function listSeoRedirects(): Promise<SeoRedirect[]> {
  try {
    const map = await fetchRedirectMap();
    return [...map.values()];
  } catch {
    return [...(redirectCache?.bySource.values() ?? [])];
  }
}
