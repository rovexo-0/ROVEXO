import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Official ROVEXO Listing Card — layout lock", () => {
  const tsx = readSource("components/ui/ListingCard.tsx");
  const css = readSource("components/ui/ListingCard.module.css");

  it("marks component as frozen official-2.0", () => {
    expect(tsx).toContain('export const LISTING_CARD_UI_VERSION = "official-2.1"');
    expect(tsx).toContain('export const LISTING_CARD_UI_STATUS = "FROZEN"');
    expect(tsx).toContain('data-hp-listing-card="official"');
  });

  it("implements full official card structure", () => {
    expect(tsx).toContain("ShieldCheck");
    expect(tsx).toContain("humanizeListingCondition");
    expect(tsx).toContain("formatListingPriceIncl");
    expect(tsx).toContain('<Avatar');
    expect(tsx).toContain("IconStar");
    expect(tsx).not.toContain("StarRow");
    expect(css).toContain(".protection");
    expect(css).toContain(".divider");
    expect(css).toContain(".sellerAvatar");
    expect(css).toContain(".rating");
    expect(css).toContain(".starIcon");
    expect(css).toContain("-webkit-line-clamp: 2");
  });

  it("uses design system tokens for layout", () => {
    expect(css).toContain("var(--rx-listing-radius");
    expect(css).toContain("var(--ds-color-primary)");
    expect(css).toContain("var(--ds-color-success)");
    expect(css).toContain("aspect-ratio: var(--rx-listing-image-ratio");
  });

  it("implements listing promotion badges on homepage cards", () => {
    expect(tsx).toContain("resolveHomepagePromotionBadge");
    expect(tsx).toContain("ListingPromotionBadge");
    expect(css).toContain(".badge");
    expect(css).toContain('data-tone="premium"');
  });

  it("locks responsive favourite and premium hover", () => {
    expect(css).toContain("var(--rx-listing-save-size");
    expect(css).toContain("translateY(-3px)");
    expect(css).toContain("prefers-reduced-motion");
  });
});
