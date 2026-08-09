/**
 * OPT-P0-PERF-07 — module cache for GET /api/inbox/badge.
 * Survives provider remount; must be cleared on logout / guest gate.
 */

export type InboxBadgeCacheValue = {
  messages: number;
  notifications: number;
  ok: boolean;
};

/** Short TTL so BetaAppShell remounts do not re-hit the API. */
export const INBOX_BADGE_TTL_MS = 2_500;

let inboxBadgeInflight: Promise<InboxBadgeCacheValue> | null = null;
let inboxBadgeCache: { at: number; value: InboxBadgeCacheValue } | null = null;

export function clearInboxBadgeModuleCache(): void {
  inboxBadgeInflight = null;
  inboxBadgeCache = null;
}

export function peekInboxBadgeModuleCache(): InboxBadgeCacheValue | null {
  if (!inboxBadgeCache) return null;
  if (Date.now() - inboxBadgeCache.at >= INBOX_BADGE_TTL_MS) return null;
  return inboxBadgeCache.value;
}

export function readInboxBadgeInflight(): Promise<InboxBadgeCacheValue> | null {
  return inboxBadgeInflight;
}

export function setInboxBadgeInflight(promise: Promise<InboxBadgeCacheValue> | null): void {
  inboxBadgeInflight = promise;
}

export function writeInboxBadgeModuleCache(value: InboxBadgeCacheValue): void {
  inboxBadgeCache = { at: Date.now(), value };
}
