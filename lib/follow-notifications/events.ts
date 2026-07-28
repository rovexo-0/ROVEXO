import type { FollowNotificationEventType } from "@/lib/follow-notifications/follow-notifications-engine-v1";

export type FollowNotificationPrefs = {
  followActivity: boolean;
  newListings: boolean;
  priceReductions: boolean;
  badgeAwards: boolean;
  /** Marketing channel — OFF by default */
  marketing: boolean;
};

export const DEFAULT_FOLLOW_NOTIFICATION_PREFS: FollowNotificationPrefs = {
  followActivity: true,
  newListings: true,
  priceReductions: true,
  badgeAwards: true,
  marketing: false,
};

export type FollowNotificationEvent = {
  type: FollowNotificationEventType;
  /** Actor who caused the event (follower or seller). */
  actorId: string;
  actorName: string;
  actorUsername?: string;
  actorAvatarUrl?: string | null;
  /** Seller / followed user for fan-out events. */
  sellerId?: string;
  /** Recipient for direct events (e.g. FollowCreated → followed user). */
  recipientId?: string;
  listingId?: string;
  listingSlug?: string;
  listingTitle?: string;
  badgeId?: string;
  badgeLabel?: string;
  occurredAt?: string;
  /** Idempotency seed — engine derives final key. */
  dedupeKey?: string;
};

export type FollowNotificationUserPrefsUpdate = Partial<FollowNotificationPrefs>;
