import { createAdminClient } from "@/lib/supabase/admin";
import type { SeoRedirect } from "@/lib/seo/engine/types";

const CACHE_TTL_MS = 5 * 60 * 1000;

type RedirectCache = {
  expiresAt: number;
  bySource: Map<string, SeoRedirect>;
};

let redirectCache: RedirectCache | null = null;

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "/";
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.replace(/\/+$/, "") || "/";
}

async function loadRedirectMap(): Promise<Map<string, SeoRedirect>> {
  if (redirectCache && redirectCache.expiresAt > Date.now()) {
    return redirectCache.bySource;
  }

  try {
    const admin = createAdminClient();
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
  } catch {
    return redirectCache?.bySource ?? new Map();
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
  const map = await loadRedirectMap();
  return [...map.values()];
}
