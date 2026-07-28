/**
 * Follow notification preference store (in-memory SSOT for engine prefs).
 * Marketplace ON by default · Marketing OFF by default.
 */

import {
  DEFAULT_FOLLOW_NOTIFICATION_PREFS,
  type FollowNotificationPrefs,
  type FollowNotificationUserPrefsUpdate,
} from "@/lib/follow-notifications/events";

const prefsByUser = new Map<string, FollowNotificationPrefs>();

export function getFollowNotificationPrefs(userId: string): FollowNotificationPrefs {
  return prefsByUser.get(userId) ?? { ...DEFAULT_FOLLOW_NOTIFICATION_PREFS };
}

export function updateFollowNotificationUserPrefs(
  userId: string,
  patch: FollowNotificationUserPrefsUpdate,
): FollowNotificationPrefs {
  const next = { ...getFollowNotificationPrefs(userId), ...patch };
  prefsByUser.set(userId, next);
  return next;
}
