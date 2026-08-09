/**
 * OPT-P0-PERF-07 — clear private client caches at auth boundaries.
 * Not an auth source of truth. AuthProvider remains the only identity SSOT.
 */

import { discardBundleMirror, BUNDLE_GET_SHARE_KEY } from "@/lib/bundle/bundle-mirror-v1";
import { clearInboxBadgeModuleCache } from "@/lib/notifications/inbox-badge-client-cache-v1";
import { invalidateShareInflight } from "@/lib/performance/fetch";
import { invalidateSavedStatusCache } from "@/lib/saved/saved-status-cache";

/** Logout / SIGNED_OUT — guest must not see prior private UI state. */
export function clearPrivateClientSessionCachesOnLogout(): void {
  invalidateSavedStatusCache();
  clearInboxBadgeModuleCache();
  discardBundleMirror();
  invalidateShareInflight(BUNDLE_GET_SHARE_KEY);
}

/**
 * Login / authenticated hydrate — drop guest empty-Set / TTL so AUTH re-fetches.
 * Does not invent auth state; callers still gate on AuthProvider profile.
 */
export function preparePrivateClientSessionCachesForAuthHydrate(): void {
  invalidateSavedStatusCache();
  clearInboxBadgeModuleCache();
  invalidateShareInflight(BUNDLE_GET_SHARE_KEY);
}
