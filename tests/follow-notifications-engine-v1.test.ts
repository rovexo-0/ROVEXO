import { describe, expect, it } from "vitest";
import { FOLLOW_NOTIFICATIONS_ENGINE_V1 } from "@/lib/follow-notifications/follow-notifications-engine-v1";
import { DEFAULT_FOLLOW_NOTIFICATION_PREFS } from "@/lib/follow-notifications/events";
import {
  FOLLOW_NOTIFICATION_THROTTLE,
  shouldThrottleFollowNotification,
} from "@/lib/follow-notifications/throttle";
import {
  getFollowNotificationPrefs,
  updateFollowNotificationUserPrefs,
} from "@/lib/follow-notifications/prefs";

describe("Follow Notifications Engine v1.0", () => {
  it("locks one engine · one store · one API", () => {
    expect(FOLLOW_NOTIFICATIONS_ENGINE_V1.version).toBe("1.0");
    expect(FOLLOW_NOTIFICATIONS_ENGINE_V1.apiPath).toBe("/api/follow-notifications");
    expect(FOLLOW_NOTIFICATIONS_ENGINE_V1.rules.oneEngine).toBe(true);
    expect(FOLLOW_NOTIFICATIONS_ENGINE_V1.rules.neverCreateFollowRelationships).toBe(true);
    expect(FOLLOW_NOTIFICATIONS_ENGINE_V1.rules.neverInspectFollowDatabaseDirectly).toBe(true);
  });

  it("supports required event types", () => {
    expect(FOLLOW_NOTIFICATIONS_ENGINE_V1.supportedEvents).toEqual(
      expect.arrayContaining([
        "FollowCreated",
        "FollowRemoved",
        "NewListingPublished",
        "ListingRelisted",
        "PriceReduced",
        "SellerBadgeAwarded",
        "SellerVerified",
      ]),
    );
  });

  it("defaults marketplace ON and marketing OFF", () => {
    expect(DEFAULT_FOLLOW_NOTIFICATION_PREFS.followActivity).toBe(true);
    expect(DEFAULT_FOLLOW_NOTIFICATION_PREFS.newListings).toBe(true);
    expect(DEFAULT_FOLLOW_NOTIFICATION_PREFS.priceReductions).toBe(true);
    expect(DEFAULT_FOLLOW_NOTIFICATION_PREFS.badgeAwards).toBe(true);
    expect(DEFAULT_FOLLOW_NOTIFICATION_PREFS.marketing).toBe(false);
  });

  it("updates user preferences in place", () => {
    const prefs = updateFollowNotificationUserPrefs("user-a", {
      newListings: false,
      marketing: true,
    });
    expect(prefs.newListings).toBe(false);
    expect(prefs.marketing).toBe(true);
    expect(getFollowNotificationPrefs("user-a").followActivity).toBe(true);
  });

  it("throttles repeated identical event classes", () => {
    const recipientId = `throttle-${Date.now()}`;
    const first = shouldThrottleFollowNotification({
      recipientId,
      eventClass: "FollowCreated",
      now: 1_000,
    });
    const second = shouldThrottleFollowNotification({
      recipientId,
      eventClass: "FollowCreated",
      now:
        1_000 +
        Math.floor(FOLLOW_NOTIFICATION_THROTTLE.windowMs / FOLLOW_NOTIFICATION_THROTTLE.maxPerWindow) -
        1,
    });
    expect(first).toBe(false);
    expect(second).toBe(true);
  });

  it("does not modify forbidden modules list", () => {
    expect(FOLLOW_NOTIFICATIONS_ENGINE_V1.doesNotModify).toEqual(
      expect.arrayContaining([
        "Follow Engine",
        "Rating Engine",
        "Reviews Engine",
        "Reputation Engine",
        "Badge Engine",
        "Orders",
        "Wallet",
        "Payments",
        "Messaging",
        "Homepage",
        "Search",
        "Products",
        "Categories",
      ]),
    );
  });
});
