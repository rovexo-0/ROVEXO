import {
  DEFAULT_FOLLOWING_FEED_PREFS,
  type FollowingFeedPrefs,
  type FollowingFeedPrefsUpdate,
} from "@/lib/following-feed/types";

const prefsByUser = new Map<string, FollowingFeedPrefs>();

export function getFollowingFeedPrefs(userId: string): FollowingFeedPrefs {
  return prefsByUser.get(userId) ?? { ...DEFAULT_FOLLOWING_FEED_PREFS };
}

export function updateFollowingFeedPrefs(
  userId: string,
  patch: FollowingFeedPrefsUpdate,
): FollowingFeedPrefs {
  const next = { ...getFollowingFeedPrefs(userId), ...patch };
  prefsByUser.set(userId, next);
  return next;
}
