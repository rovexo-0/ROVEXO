import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Official Listing Card — supersedes v3/v4 freeze", () => {
  const tsx = readSource("components/ui/ListingCard.tsx");
  const css = readSource("components/ui/ListingCard.module.css");

  it("marks component as frozen official-2.0", () => {
    expect(tsx).toContain('export const LISTING_CARD_UI_VERSION = "official-2.1"');
    expect(tsx).toContain('export const LISTING_CARD_UI_STATUS = "FROZEN"');
    expect(tsx).toContain('data-hp-listing-card="official"');
    expect(css).toContain("aspect-ratio: var(--rx-listing-image-ratio");
  });

  it("locks premium shell tokens", () => {
    expect(css).toContain("var(--rx-listing-radius");
    expect(css).toContain("var(--rx-listing-shadow");
    expect(css).toContain("var(--ds-color-surface)");
  });

  it("locks image and favourite", () => {
    expect(css).toContain("object-fit: cover");
    expect(css).toContain("var(--rx-listing-save-size");
    expect(css).toContain("var(--rx-listing-save-inset");
  });

  it("locks official content hierarchy", () => {
    expect(css).toContain(".title");
    expect(css).toContain(".condition");
    expect(css).toContain(".price");
    expect(css).toContain(".protection");
    expect(css).toContain(".footer");
    expect(css).toContain("var(--ds-color-primary)");
    expect(css).toContain("var(--ds-color-success)");
  });

  it("renders title → condition → price → protection → footer", () => {
    expect(tsx).toContain("css.title");
    expect(tsx).toContain("css.condition");
    expect(tsx).toContain("css.price");
    expect(tsx).toContain("css.protection");
    expect(tsx).toContain("IconStar");
    expect(tsx).not.toContain("StarRow");
  });

  it("formats rating and views for footer", async () => {
    const { formatCardRating, formatCardViews } = await import("@/components/ui/ListingCard");

    expect(formatCardRating({ rating: 4.9 })).toBe("4.9");
    expect(formatCardRating({ rating: 0 })).toBe("—");
    expect(formatCardViews(235)).toBe("235");
    expect(formatCardViews(1200)).toBe("1.2K");
  });
});
