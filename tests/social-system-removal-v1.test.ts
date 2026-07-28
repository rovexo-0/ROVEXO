import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  isMarketplaceFollowAuthorized,
  SOCIAL_MEDIA_FORBIDDEN_TOKENS,
  SOCIAL_SYSTEM_REMOVAL_STATUS,
} from "@/lib/social/social-system-removal-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 — Social Media Removal + Marketplace Follow (XLVI)", () => {
  it("keeps social-media FollowSellerButton deleted", () => {
    expect(existsSync(join(process.cwd(), "features/launch/components/FollowSellerButton.tsx"))).toBe(
      false,
    );
    expect(existsSync(join(process.cwd(), "lib/launch/follow-sellers.ts"))).toBe(false);
  });

  it("authorizes marketplace Follow via Blood Code XLVI", () => {
    expect(SOCIAL_SYSTEM_REMOVAL_STATUS).toBe("SOCIAL_MEDIA_PERMANENTLY_REMOVED");
    expect(isMarketplaceFollowAuthorized()).toBe(true);
    expect(SOCIAL_MEDIA_FORBIDDEN_TOKENS).toContain("Stories");
    expect(existsSync(join(process.cwd(), "app/api/follows/route.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "features/profile/components/FollowButton.tsx"))).toBe(
      true,
    );
  });

  it("locks migration history + XLVI marketplace follow migration", () => {
    const removal = readSource(
      "supabase/migrations/20260721193000_social_follow_system_removal_v1.sql",
    );
    const xlvi = readSource(
      "supabase/migrations/20260726223000_marketplace_follow_xlvi_v1.sql",
    );
    const rule = readSource(".cursor/rules/social-system-removal-v1.mdc");
    const ssot = readSource("lib/social/social-system-removal-v1.ts");

    expect(removal).toContain("drop table if exists public.seller_follows");
    expect(xlvi).toContain("user_follows");
    expect(rule).toContain("PERMANENTLY REMOVED");
    expect(ssot).toContain("AUTHORIZED_XLVI");
  });

  it("strips Follow from Showcase header and PremiumButton API", () => {
    const header = readSource(
      "components/homepage/canonical/featured-store/FeaturedStoreHeader.tsx",
    );
    const btn = readSource("components/ui/PremiumButton.tsx");
    const freeze = readSource("lib/homepage/homepage-final-freeze-v1.ts");

    expect(header).not.toContain("FollowSellerButton");
    expect(header).toContain("Social Follow permanently removed");
    expect(btn).not.toContain('"follow"');
    expect(btn).not.toContain('"following"');
    expect(freeze).toContain('socialFollow: "PERMANENTLY_REMOVED"');
    expect(freeze).not.toContain("FOLLOW_BUTTON_LABELS");
  });

  it("redirects legacy account/business followers routes to Profile", () => {
    const account = readSource("app/account/followers/page.tsx");
    const business = readSource("app/business/followers/page.tsx");
    expect(account).toContain('redirect("/account")');
    expect(business).toContain('redirect("/account")');
  });
});
