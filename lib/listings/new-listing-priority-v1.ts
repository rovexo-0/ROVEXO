/**
 * ROVEXO v1.0 — NEW LISTING PRIORITY FREEZE
 * Global store / my-listings sort policy: createdAt DESC (newest first).
 * Does not change Search / Homepage / Boost ranking defaults.
 */

export const NEW_LISTING_PRIORITY_VERSION = "1.0" as const;
export const NEW_LISTING_PRIORITY_STATUS = "LOCKED" as const;
export const NEW_LISTING_PRIORITY_SORT = "createdAt DESC" as const;

export function compareCreatedAtDesc(
  a: { createdAt?: string | null; id?: string },
  b: { createdAt?: string | null; id?: string },
): number {
  const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  if (bTime !== aTime) return bTime - aTime;
  return String(b.id ?? "").localeCompare(String(a.id ?? ""));
}

export function sortByCreatedAtDesc<T extends { createdAt?: string | null; id?: string }>(
  items: readonly T[],
): T[] {
  return [...items].sort(compareCreatedAtDesc);
}
