/**
 * Shared Saved-status hydrate — one GET /api/saved for all hearts on a surface.
 * Optimizes N× GET ?slug= into 1× list fetch (same Saved SSOT, zero parallel systems).
 */
type SavedListPayload = {
  items?: Array<{ slug?: string; productSlug?: string }>;
};

let inflight: Promise<Set<string>> | null = null;
let cached: Set<string> | null = null;

export function invalidateSavedStatusCache(): void {
  inflight = null;
  cached = null;
}

export function peekSavedStatusCache(): Set<string> | null {
  return cached;
}

export function markSavedInCache(slug: string, saved: boolean): void {
  if (!cached) cached = new Set();
  if (saved) cached.add(slug);
  else cached.delete(slug);
}

export async function loadSavedSlugSet(): Promise<Set<string>> {
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch("/api/saved", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((payload: SavedListPayload) => {
        const next = new Set<string>();
        for (const item of payload.items ?? []) {
          const slug = item.slug ?? item.productSlug;
          if (slug) next.add(slug);
        }
        cached = next;
        return next;
      })
      .catch(() => {
        const empty = new Set<string>();
        cached = empty;
        return empty;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}
