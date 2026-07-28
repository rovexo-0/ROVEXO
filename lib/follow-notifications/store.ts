/**
 * Follow Notifications Engine v1.0 — Store / processor
 * Consumes events → prefs → throttle → emitSmartNotification
 * Never creates follow relationships. Never queries user_follows directly.
 */

import "server-only";

import { emitSmartNotification } from "@/lib/notifications/events";
import {
  getFollowEdgeNotificationPrefs,
  listFollowers,
} from "@/lib/follow/marketplace-follow-store-v1";
import type { FollowNotificationEvent } from "@/lib/follow-notifications/events";
import type { FollowNotificationPrefs } from "@/lib/follow-notifications/events";
import { getFollowNotificationPrefs } from "@/lib/follow-notifications/prefs";
import { shouldThrottleFollowNotification } from "@/lib/follow-notifications/throttle";

const failedQueue: FollowNotificationEvent[] = [];

function getPrefs(userId: string): FollowNotificationPrefs {
  return getFollowNotificationPrefs(userId);
}

function profileHref(username?: string, userId?: string): string {
  if (username) return `/user/${username}`;
  if (userId) return `/user/${userId}`;
  return "/";
}

function listingHref(slug?: string, id?: string): string {
  if (slug) return `/listing/${slug}`;
  if (id) return `/listing/${id}`;
  return "/search";
}

async function emitSafe(input: Parameters<typeof emitSmartNotification>[0]): Promise<boolean> {
  try {
    return await emitSmartNotification(input);
  } catch {
    return false;
  }
}

async function resolveFollowerRecipientIds(sellerId: string): Promise<string[]> {
  // Consume Follow Engine public list API — never query user_follows in this engine.
  const ids: string[] = [];
  let offset = 0;
  const limit = 50;
  for (let page = 0; page < 20; page += 1) {
    const batch = await listFollowers(sellerId, null, { limit, offset });
    if (batch.length === 0) break;
    for (const row of batch) ids.push(row.id);
    if (batch.length < limit) break;
    offset += limit;
  }
  return ids;
}

async function deliverFollowCreated(event: FollowNotificationEvent): Promise<boolean> {
  const recipientId = event.recipientId;
  if (!recipientId) return false;
  const prefs = getPrefs(recipientId);
  if (!prefs.followActivity) return false;
  if (
    shouldThrottleFollowNotification({
      recipientId,
      eventClass: "FollowCreated",
    })
  ) {
    return false;
  }

  return emitSafe({
    userId: recipientId,
    eventType: "follow_created",
    idempotencyKey:
      event.dedupeKey ??
      `follow-created:${event.actorId}:${recipientId}:${event.occurredAt ?? "now"}`,
    notificationType: "follower",
    title: `${event.actorName} started following you.`,
    subtitle: "New follower",
    href: profileHref(event.actorUsername, event.actorId),
    avatarUrl: event.actorAvatarUrl ?? undefined,
    avatarName: event.actorName,
    groupKey: `follow-created:${recipientId}`,
    payload: {
      actorId: event.actorId,
      groupHint: `followers:${recipientId}`,
    },
  });
}

async function fanOutToFollowers(
  event: FollowNotificationEvent,
  input: {
    eventClass: string;
    prefKey: keyof FollowNotificationPrefs;
    title: string;
    subtitle: string;
    href: string;
    eventType: "follow_new_listing" | "follow_price_reduced" | "follow_listing_relisted" | "follow_seller_badge";
  },
): Promise<number> {
  if (!event.sellerId) return 0;
  const followers = await resolveFollowerRecipientIds(event.sellerId);
  let sent = 0;
  for (const recipientId of followers) {
    if (recipientId === event.actorId) continue;
    const prefs = getPrefs(recipientId);
    if (!prefs[input.prefKey]) continue;

    // Per-edge Follow prefs (DB SSOT on user_follows) — marketplace listing/price only.
    if (
      input.prefKey === "newListings" ||
      input.prefKey === "priceReductions"
    ) {
      const edge = await getFollowEdgeNotificationPrefs(recipientId, event.sellerId);
      if (edge) {
        if (input.prefKey === "newListings" && !edge.notifyNewListings) continue;
        if (input.prefKey === "priceReductions" && !edge.notifyPriceDrops) continue;
      }
    }

    if (
      shouldThrottleFollowNotification({
        recipientId,
        eventClass: input.eventClass,
      })
    ) {
      continue;
    }
    // Idempotency MUST include recipient — shared listing keys must not collapse fan-out.
    const baseKey =
      event.dedupeKey ??
      `${input.eventClass}:${event.sellerId}:${event.listingId ?? event.badgeId ?? "x"}`;
    const ok = await emitSafe({
      userId: recipientId,
      eventType: input.eventType,
      idempotencyKey: `${baseKey}:${recipientId}`,
      notificationType: "system",
      title: input.title,
      subtitle: input.subtitle,
      href: input.href,
      avatarUrl: event.actorAvatarUrl ?? undefined,
      avatarName: event.actorName,
      groupKey: `${input.eventClass}:${recipientId}`,
      payload: {
        sellerId: event.sellerId,
        listingId: event.listingId,
        badgeId: event.badgeId,
        groupHint: `${input.eventClass}:${recipientId}`,
      },
    });
    if (ok) sent += 1;
  }
  return sent;
}

export async function processFollowNotificationEvent(
  event: FollowNotificationEvent,
): Promise<{ ok: boolean; delivered: number }> {
  try {
    switch (event.type) {
      case "FollowCreated": {
        const ok = await deliverFollowCreated(event);
        return { ok, delivered: ok ? 1 : 0 };
      }
      case "FollowRemoved":
        // No spam on unfollow — event accepted, zero delivery.
        return { ok: true, delivered: 0 };
      case "NewListingPublished": {
        const delivered = await fanOutToFollowers(event, {
          eventClass: "NewListingPublished",
          prefKey: "newListings",
          eventType: "follow_new_listing",
          title: `${event.actorName} published a new item.`,
          subtitle: event.listingTitle ?? "New listing",
          href: listingHref(event.listingSlug, event.listingId),
        });
        return { ok: true, delivered };
      }
      case "ListingRelisted": {
        const delivered = await fanOutToFollowers(event, {
          eventClass: "ListingRelisted",
          prefKey: "newListings",
          eventType: "follow_listing_relisted",
          title: `${event.actorName} relisted an item.`,
          subtitle: event.listingTitle ?? "Relisted",
          href: listingHref(event.listingSlug, event.listingId),
        });
        return { ok: true, delivered };
      }
      case "PriceReduced": {
        const delivered = await fanOutToFollowers(event, {
          eventClass: "PriceReduced",
          prefKey: "priceReductions",
          eventType: "follow_price_reduced",
          title: `Price dropped on an item from ${event.actorName}.`,
          subtitle: event.listingTitle ?? "Price reduced",
          href: listingHref(event.listingSlug, event.listingId),
        });
        return { ok: true, delivered };
      }
      case "SellerBadgeAwarded": {
        const delivered = await fanOutToFollowers(event, {
          eventClass: "SellerBadgeAwarded",
          prefKey: "badgeAwards",
          eventType: "follow_seller_badge",
          title: `${event.actorName} earned the ${event.badgeLabel ?? "new"} badge.`,
          subtitle: "Seller badge",
          href: profileHref(event.actorUsername, event.sellerId ?? event.actorId),
        });
        return { ok: true, delivered };
      }
      case "SellerVerified": {
        const delivered = await fanOutToFollowers(event, {
          eventClass: "SellerVerified",
          prefKey: "badgeAwards",
          eventType: "follow_seller_badge",
          title: `${event.actorName} is now verified.`,
          subtitle: "Verified seller",
          href: profileHref(event.actorUsername, event.sellerId ?? event.actorId),
        });
        return { ok: true, delivered };
      }
      default:
        return { ok: false, delivered: 0 };
    }
  } catch {
    failedQueue.push(event);
    if (failedQueue.length > 200) failedQueue.shift();
    return { ok: false, delivered: 0 };
  }
}

/** Fail-safe retry for queued failed deliveries. */
export async function retryFollowNotificationQueue(): Promise<number> {
  const batch = failedQueue.splice(0, failedQueue.length);
  let recovered = 0;
  for (const event of batch) {
    const result = await processFollowNotificationEvent(event);
    if (result.ok) recovered += 1;
  }
  return recovered;
}

export function getFollowNotificationQueueDepth(): number {
  return failedQueue.length;
}
