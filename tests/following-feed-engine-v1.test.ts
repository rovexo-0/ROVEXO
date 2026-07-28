import { describe, expect, it } from "vitest";
import { FOLLOWING_FEED_ENGINE_V1 } from "@/lib/following-feed/following-feed-engine-v1";
import {
  DEFAULT_FOLLOWING_FEED_PREFS,
} from "@/lib/following-feed/types";
import {
  getFollowingFeedPrefs,
  updateFollowingFeedPrefs,
} from "@/lib/following-feed/prefs";

describe("Homepage Following Feed Engine v1.0", () => {
  it("locks one engine · one store · one API", () => {
    expect(FOLLOWING_FEED_ENGINE_V1.version).toBe("1.0");
    expect(FOLLOWING_FEED_ENGINE_V1.apiPath).toBe("/api/homepage/following-feed");
    expect(FOLLOWING_FEED_ENGINE_V1.rules.oneEngine).toBe(true);
    expect(FOLLOWING_FEED_ENGINE_V1.rules.neverCreateFollowRelationships).toBe(true);
    expect(FOLLOWING_FEED_ENGINE_V1.rules.neverInspectFollowDatabaseDirectly).toBe(true);
    expect(FOLLOWING_FEED_ENGINE_V1.rules.consumeFollowEngineApisOnly).toBe(true);
    expect(FOLLOWING_FEED_ENGINE_V1.purpose).toBe("marketplace_discovery");
  });

  it("supports marketplace feed events only", () => {
    expect(FOLLOWING_FEED_ENGINE_V1.visibleEvents).toEqual(
      expect.arrayContaining([
        "NEW_LISTING",
        "PRICE_REDUCTION",
        "RELISTED_ITEM",
        "SELLER_VERIFIED",
        "NEW_PUBLIC_BADGE",
        "FEATURED_LISTING",
      ]),
    );
    expect(FOLLOWING_FEED_ENGINE_V1.doesNotDisplay).toEqual(
      expect.arrayContaining([
        "Stories",
        "Posts",
        "Comments",
        "Likes",
        "Personal messages",
      ]),
    );
  });

  it("defaults marketplace prefs ON", () => {
    expect(DEFAULT_FOLLOWING_FEED_PREFS.newListings).toBe(true);
    expect(DEFAULT_FOLLOWING_FEED_PREFS.priceDrops).toBe(true);
    expect(DEFAULT_FOLLOWING_FEED_PREFS.relistedItems).toBe(true);
    expect(DEFAULT_FOLLOWING_FEED_PREFS.verifiedSellerEvents).toBe(true);
    expect(DEFAULT_FOLLOWING_FEED_PREFS.badgeEvents).toBe(true);
  });

  it("updates preferences in place", () => {
    const prefs = updateFollowingFeedPrefs("viewer-1", { priceDrops: false });
    expect(prefs.priceDrops).toBe(false);
    expect(getFollowingFeedPrefs("viewer-1").newListings).toBe(true);
  });

  it("forbids social features and forbidden module edits", () => {
    expect(FOLLOWING_FEED_ENGINE_V1.rules.noSocialStoriesPostsLikesComments).toBe(true);
    expect(FOLLOWING_FEED_ENGINE_V1.doesNotModify).toEqual(
      expect.arrayContaining([
        "Follow Engine",
        "Notification Engine",
        "Badge Engine",
        "Products",
        "Search",
        "Authentication",
      ]),
    );
  });

  it("defines empty and fail-safe copy", () => {
    expect(FOLLOWING_FEED_ENGINE_V1.emptyStateCopy).toContain("Follow sellers");
    expect(FOLLOWING_FEED_ENGINE_V1.failSafeCopy).toBe("Unable to load Following Feed.");
  });
});
