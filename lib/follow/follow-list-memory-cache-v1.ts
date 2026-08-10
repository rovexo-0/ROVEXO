/**
 * Followers / Following list — in-memory client cache (v1.0).
 * UI performance only · no API/DB/business-logic ownership.
 */

export type FollowListCacheItem = {
  id: string;
  username: string;
  avatarUrl: string | null;
  rating: number;
  reviewCount: number;
  isFollowing: boolean;
};

export type FollowListCacheEntry = {
  items: FollowListCacheItem[];
  hasMore: boolean;
  offset: number;
  updatedAt: number;
};

type CacheKey = string;

const LIST_TTL_MS = 60_000;
const store = new Map<CacheKey, FollowListCacheEntry>();

export function followListCacheKey(
  userId: string,
  mode: "followers" | "following",
  query = "",
): CacheKey {
  return `${userId}::${mode}::${query.trim().toLowerCase()}`;
}

export function readFollowListCache(key: CacheKey): FollowListCacheEntry | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.updatedAt > LIST_TTL_MS) {
    store.delete(key);
    return null;
  }
  return hit;
}

export function writeFollowListCache(key: CacheKey, entry: Omit<FollowListCacheEntry, "updatedAt">) {
  store.set(key, { ...entry, updatedAt: Date.now() });
}

export function patchFollowListCacheFollowing(targetUserId: string, isFollowing: boolean) {
  for (const [key, entry] of store) {
    let changed = false;
    const items = entry.items.map((row) => {
      if (row.id !== targetUserId) return row;
      changed = true;
      return { ...row, isFollowing };
    });
    if (changed) {
      store.set(key, { ...entry, items, updatedAt: Date.now() });
    }
  }
}
