/**
 * Throttle / anti-spam for Follow Notifications Engine v1.0
 */

const buckets = new Map<string, number>();

export const FOLLOW_NOTIFICATION_THROTTLE = {
  /** Max identical event class per recipient per window */
  maxPerWindow: 3,
  windowMs: 15 * 60 * 1000,
} as const;

export function shouldThrottleFollowNotification(input: {
  recipientId: string;
  eventClass: string;
  now?: number;
}): boolean {
  const now = input.now ?? Date.now();
  const key = `${input.recipientId}:${input.eventClass}`;
  const last = buckets.get(key);
  if (last != null && now - last < FOLLOW_NOTIFICATION_THROTTLE.windowMs / FOLLOW_NOTIFICATION_THROTTLE.maxPerWindow) {
    return true;
  }
  buckets.set(key, now);
  if (buckets.size > 5000) {
    const cutoff = now - FOLLOW_NOTIFICATION_THROTTLE.windowMs;
    for (const [k, ts] of buckets) {
      if (ts < cutoff) buckets.delete(k);
    }
  }
  return false;
}
