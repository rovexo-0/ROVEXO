/**
 * Detect newly earned public badges and fan-out follow notifications.
 * Consumes Badge Engine public results — does not modify Badge Engine.
 */

import "server-only";

import type { PublicBadge } from "@/lib/badge/store";
import { processFollowNotificationEvent } from "@/lib/follow-notifications/store";
import { resolveFollowNotificationActor } from "@/lib/follow-notifications/actor";

const lastSeenBadgeIds = new Map<string, Set<string>>();

export async function consumePublicBadgeSnapshotForFollowNotifications(
  userId: string,
  badges: PublicBadge[],
): Promise<number> {
  const nextIds = new Set(badges.map((b) => b.id));
  const prev = lastSeenBadgeIds.get(userId);
  lastSeenBadgeIds.set(userId, nextIds);
  if (!prev) return 0;

  const newlyAwarded = badges.filter((b) => !prev.has(b.id));
  if (newlyAwarded.length === 0) return 0;

  const actor = await resolveFollowNotificationActor(userId);
  let delivered = 0;
  for (const badge of newlyAwarded) {
    const result = await processFollowNotificationEvent({
      type: "SellerBadgeAwarded",
      actorId: userId,
      actorName: actor.name,
      actorUsername: actor.username,
      actorAvatarUrl: actor.avatarUrl,
      sellerId: userId,
      badgeId: badge.id,
      badgeLabel: badge.label,
      occurredAt: new Date().toISOString(),
      dedupeKey: `seller-badge:${userId}:${badge.id}:${Date.now()}`,
    });
    delivered += result.delivered;
  }
  return delivered;
}
