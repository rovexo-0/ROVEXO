import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  BADGE_VISUAL_CATALOG,
  BADGE_VISUAL_KEYS,
  BADGE_VISUAL_SYSTEM_V2,
  listBadgeVisualGlyphs,
  resolveBadgeVisual,
  resolveBadgeVisualKey,
} from "@/lib/badge/badge-visual-system-v2";
import { BADGE_ENGINE_V1 } from "@/lib/badge/badge-engine-v1";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/seller-performance/master-spec";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Badge Visual System v2", () => {
  it("is visual-only and does not replace Badge Engine", () => {
    expect(BADGE_VISUAL_SYSTEM_V2.version).toBe("2.0");
    expect(BADGE_VISUAL_SYSTEM_V2.kind).toBe("VISUAL_ONLY");
    expect(BADGE_VISUAL_SYSTEM_V2.doesNotModify).toContain("Badge Engine");
    expect(BADGE_ENGINE_V1.version).toBe("1.0");
    expect(BADGE_ENGINE_V1.lock).toBe("lib/badge/badge-engine-v1.ts");
  });

  it("gives every mapped badge a unique glyph", () => {
    const glyphs = listBadgeVisualGlyphs();
    expect(new Set(glyphs).size).toBe(BADGE_VISUAL_KEYS.length);
    for (const key of BADGE_VISUAL_KEYS) {
      expect(BADGE_VISUAL_CATALOG[key].glyph).toBe(key);
    }
  });

  it("keeps required badge identities distinct", () => {
    const pairs: Array<[string, string]> = [
      ["first_sale", "verified_seller"],
      ["verified_seller", "trusted_seller"],
      ["trusted_seller", "top_seller"],
      ["top_seller", "premium_seller"],
      ["premium_seller", "elite_seller"],
      ["fast_responder", "fast_dispatch"],
      ["fast_dispatch", "fast_shipper"],
      ["top_rated", "reviews_100_positive"],
      ["orders_10", "orders_50"],
      ["orders_50", "orders_500"],
      ["orders_500", "orders_1000"],
    ];
    for (const [left, right] of pairs) {
      expect(resolveBadgeVisual(left)?.glyph).not.toBe(resolveBadgeVisual(right)?.glyph);
    }
  });

  it("resolves achievement labels and engine ids to the same artwork", () => {
    expect(resolveBadgeVisualKey("First Sale")).toBe("first_sale");
    expect(resolveBadgeVisualKey("Verified Seller")).toBe("verified_seller");
    expect(resolveBadgeVisualKey("Trusted Seller")).toBe("trusted_seller");
    expect(resolveBadgeVisualKey("Fast Dispatcher")).toBe("fast_dispatch");
    expect(resolveBadgeVisualKey("100 Orders")).toBe("orders_100");
    expect(resolveBadgeVisual("first_sale")?.glyph).toBe(
      resolveBadgeVisual("First Sale")?.glyph,
    );
  });

  it("covers every seller-performance achievement id", () => {
    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      expect(resolveBadgeVisualKey(definition.id)).toBe(definition.id);
    }
  });

  it("wires the same canonical artwork on Performance, Profile, and Following", () => {
    const performance = readSource(
      "features/seller-performance/components/SellerPerformanceDashboardView.tsx",
    );
    const profile = readSource("features/profile/components/ViewProfilePage.tsx");
    const following = readSource("features/home/components/FollowingFeedSection.tsx");
    const artwork = readSource("components/badge/CanonicalBadgeArtwork.tsx");

    expect(performance).toContain("CanonicalBadgeArtwork");
    expect(performance).toContain('state="earned"');
    expect(performance).toContain('state="in_progress"');
    expect(performance).toContain('state="locked"');
    expect(performance).not.toMatch(/earnedCard[\s\S]{0,180}ShieldLineIcon/);
    expect(profile).toContain("CanonicalBadgeArtwork");
    expect(following).toContain("CanonicalBadgeArtwork");
    expect(artwork).toContain('data-badge-glyph="first_sale"');
    expect(artwork).toContain('data-badge-glyph="verified_seller"');
    expect(artwork).toContain('data-badge-glyph="trusted_seller"');
    expect(artwork).toContain('data-badge-state={state}');
  });

  it("does not change Badge / Performance / Rating / Reviews engines", () => {
    const visual = readSource("lib/badge/badge-visual-system-v2.ts");
    expect(visual).not.toContain("evaluateBadgeRules");
    expect(visual).not.toContain("deriveAchievements");
    expect(visual).not.toContain("calculateSellerPerformanceScore");
    expect(readSource("lib/badge/badge-engine-v1.ts")).not.toContain("BADGE_VISUAL_SYSTEM_V2");
    expect(readSource("lib/seller-performance/achievements.ts")).not.toContain(
      "CanonicalBadgeArtwork",
    );
  });
});
