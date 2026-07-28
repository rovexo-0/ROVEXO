import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  BLOOD_FOLLOW_RATING_BADGE,
  BLOOD_FOLLOW_RATING_BADGE_LAW,
} from "@/lib/supreme-blood-code-xlvi-follow-rating-badge-v1";
import {
  isMarketplaceFollowAuthorized,
  MARKETPLACE_FOLLOW_STATUS,
  SOCIAL_SYSTEM_REMOVAL_STATUS,
} from "@/lib/social/social-system-removal-v1";
import {
  FOLLOW_BUTTON_SPEC,
  FOLLOW_IMPLEMENTATION_GATE,
  FOLLOW_RATING_BADGE_STAR_COLOR,
  REVIEW_WINDOW_DAYS,
} from "@/lib/reviews/follow-rating-badge-spec-v1";
import {
  SELLER_LEVEL_LABELS,
  SELLER_LEVEL_THRESHOLDS,
} from "@/lib/seller-performance/master-spec";
import { levelForScore as resolveLevel } from "@/lib/seller-performance/levels";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Absolute Blood Code XLVI — Follow · Rating · Badge", () => {
  it("locks marketplace-only singularity", () => {
    expect(BLOOD_FOLLOW_RATING_BADGE_LAW).toBe("XLVI");
    expect(BLOOD_FOLLOW_RATING_BADGE.marketplaceOnly).toBe(true);
    expect(BLOOD_FOLLOW_RATING_BADGE.singularity.reputationEngine).toBe("seller-performance");
    expect(BLOOD_FOLLOW_RATING_BADGE.socialMediaForbidden).toContain("Stories");
    expect(BLOOD_FOLLOW_RATING_BADGE.reviewWindowDays).toBe(4);
    expect(BLOOD_FOLLOW_RATING_BADGE.returnedOrdersAffectReputation).toBe(false);
  });

  it("authorizes marketplace Follow while social media stays removed", () => {
    expect(SOCIAL_SYSTEM_REMOVAL_STATUS).toBe("SOCIAL_MEDIA_PERMANENTLY_REMOVED");
    expect(MARKETPLACE_FOLLOW_STATUS).toBe("AUTHORIZED_XLVI");
    expect(isMarketplaceFollowAuthorized()).toBe(true);
    expect(FOLLOW_IMPLEMENTATION_GATE.implementationAllowed).toBe(true);
  });

  it("ships Follow API + button + migration", () => {
    expect(existsSync(join(process.cwd(), "app/api/follows/route.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "features/profile/components/FollowButton.tsx"))).toBe(
      true,
    );
    expect(
      existsSync(
        join(process.cwd(), "supabase/migrations/20260726223000_marketplace_follow_xlvi_v1.sql"),
      ),
    ).toBe(true);
    const migration = readSource(
      "supabase/migrations/20260726223000_marketplace_follow_xlvi_v1.sql",
    );
    expect(migration).toContain("user_follows");
    expect(migration).toContain("follower_count");
    expect(FOLLOW_BUTTON_SPEC.heightPx).toBe(48);
    expect(FOLLOW_BUTTON_SPEC.radiusPx).toBe(14);
    expect(FOLLOW_RATING_BADGE_STAR_COLOR).toBe("#F5C542");
    expect(REVIEW_WINDOW_DAYS).toBe(4);
  });

  it("evolves Seller Performance badges to Bronze→Legend in place", () => {
    expect(SELLER_LEVEL_THRESHOLDS.map((t) => t.level)).toEqual([
      "legend",
      "elite",
      "platinum",
      "diamond",
      "gold",
      "silver",
      "bronze",
    ]);
    expect(SELLER_LEVEL_LABELS.bronze).toBe("Bronze Seller");
    expect(SELLER_LEVEL_LABELS.legend).toBe("Legend Seller");
    expect(resolveLevel(0)).toBe("bronze");
    expect(resolveLevel(40)).toBe("gold");
    expect(resolveLevel(95)).toBe("legend");
  });

  it("does not revive social-media FollowSellerButton naming", () => {
    expect(existsSync(join(process.cwd(), "features/launch/components/FollowSellerButton.tsx"))).toBe(
      false,
    );
    const btn = readSource("components/ui/PremiumButton.tsx");
    expect(btn).not.toContain('"follow"');
    expect(btn).not.toContain('"following"');
  });
});
