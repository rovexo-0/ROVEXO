import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("COD SÂNGE — Listing Card portrait image ratio 4:5", () => {
  const css = read("components/ui/ListingCard.module.css");
  const tokens = read("styles/rovexo/listing-card-official.css");
  const tsx = read("components/ui/ListingCard.tsx");

  it("1/2 — two-column grid and card width remain outside this change", () => {
    const homepage = read("components/homepage/canonical/CanonicalHomepage.module.css");
    expect(homepage).toContain("repeat(var(--hp-grid-cols, 2), minmax(0, 1fr))");
    expect(css).toContain("width: 100%");
    expect(css).not.toMatch(/\.visual\s*\{[^}]*width:\s*\d+px/);
    expect(css).not.toMatch(/\.visual\s*\{[^}]*height:\s*\d+px/);
  });

  it("3 — image container uses aspect-ratio 4 / 5", () => {
    expect(tokens).toContain("--rx-listing-image-ratio: 4 / 5");
    expect(css).toContain("aspect-ratio: var(--rx-listing-image-ratio, 4 / 5)");
    expect(css).toMatch(/\.visual\s*\{[^}]*aspect-ratio:\s*var\(--rx-listing-image-ratio,\s*4 \/ 5\)/);
  });

  it("4/5 — product image source/URL path unchanged (SafeImage only)", () => {
    expect(tsx).toContain("SafeImage");
    expect(tsx).toContain("cardImageSrc");
    expect(tsx).not.toContain("brightness(");
    expect(tsx).not.toContain("contrast(");
  });

  it("6/7/8 — no filter, blur, or overlay on listing image; cover full-bleed", () => {
    expect(css).toMatch(/\.visual\s+img\s*\{[^}]*object-fit:\s*cover\s*!important/);
    expect(css).toMatch(/\.visual\s+img\s*\{[^}]*filter:\s*none\s*!important/);
    expect(css).not.toMatch(/\.visual\s+img\s*\{[^}]*blur\s*\(/);
    expect(css).not.toMatch(/\.visual\s+img\s*\{[^}]*mix-blend-mode/);
    expect(css).not.toMatch(/\.visual\s*\{[^}]*linear-gradient/);
  });

  it("9/10 — no image processing / functionality structure preserved", () => {
    expect(tsx).toContain("formatListingPrice");
    expect(tsx).toContain("showFavorite");
    expect(tsx).not.toContain("ResizeObserver");
    expect(tsx).not.toContain("createImageBitmap");
  });

  it("object-position remains center", () => {
    expect(css).toMatch(/\.visual\s+img\s*\{[^}]*object-position:\s*center\s*!important/);
  });

  it("Store premium freeze remains fixed-thumbnail (not modified)", () => {
    const store = read("styles/rovexo/store-listing-card-premium-v1.css");
    expect(store).toContain("--rx-store-img-w: 88px");
    expect(store).toContain("aspect-ratio: unset !important");
  });
});
