import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LISTING_CARD_HOMEPAGE_PROPS } from "@/lib/listing-card/defaults";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("COD SÂNGE — Listing 4:5 + View icon + View Item theme", () => {
  const cardCss = read("components/ui/ListingCard.module.css");
  const cardTsx = read("components/ui/ListingCard.tsx");
  const tokens = read("styles/rovexo/listing-card-official.css");
  const pdCss = read("styles/rovexo/product-detail-v1.css");
  const theme = read("styles/rovexo/black-underground-theme-v1.css");
  const page = read("app/(platform)/listing/[slug]/page.tsx");

  it("1 — Listing Card image container is 4:5", () => {
    expect(tokens).toContain("--rx-listing-image-ratio: 4 / 5");
    expect(cardCss).toContain("aspect-ratio: var(--rx-listing-image-ratio, 4 / 5)");
  });

  it("2/3/4/5 — image URL path unchanged; no filter/blur; cover full width", () => {
    expect(cardTsx).toContain("SafeImage");
    expect(cardTsx).toContain("cardImageSrc");
    expect(cardCss).toMatch(/\.visual\s+img\s*\{[^}]*object-fit:\s*cover\s*!important/);
    expect(cardCss).toMatch(/\.visual\s+img\s*\{[^}]*width:\s*100%\s*!important/);
    expect(cardCss).toMatch(/\.visual\s+img\s*\{[^}]*height:\s*100%\s*!important/);
    expect(cardCss).toMatch(/\.visual\s*\{[^}]*padding:\s*0/);
    expect(cardCss).toMatch(/\.visual\s*\{[^}]*margin:\s*0/);
    expect(cardCss).toMatch(/\.visual\s*\{[^}]*overflow:\s*hidden/);
    expect(cardCss).toMatch(/\.visual\s+img\s*\{[^}]*filter:\s*none\s*!important/);
    expect(cardCss).not.toMatch(/\.visual\s+img\s*\{[^}]*blur\s*\(/);
    expect(cardCss).not.toMatch(/\.visual\s+img\s*\{[^}]*object-fit:\s*contain/);
  });

  it("5/6/7 — View icon hidden on Homepage card via EyeLineIcon + showViews", () => {
    expect(LISTING_CARD_HOMEPAGE_PROPS.showViews).toBe(false);
    expect(LISTING_CARD_HOMEPAGE_PROPS.showRating).toBe(false);
    expect(cardTsx).toContain("EyeLineIcon");
    expect(cardTsx).toContain("showViews");
    expect(cardCss).toContain(".viewsHomepage");
    expect(cardCss).toContain(".viewsIconHomepage");
  });

  it("8/9/10 — View Item uses canonical theme tokens + dark/light", () => {
    expect(page).toContain("ProductDetailPage");
    expect(pdCss).toContain("--pd-v1-text: var(--rvx-text-primary");
    expect(pdCss).toContain("--pd-v1-page-bg: var(--rvx-page");
    expect(theme).toContain('html[data-theme="dark"] .pd-v1');
    expect(theme).toContain("--pd-v1-text: var(--rvx-text-primary");
    expect(theme).toContain("--pd-v1-page-bg: var(--rvx-page");
    expect(pdCss).toContain("--pd-v1-text: var(--rvx-text-primary, #111111)");
  });

  it("11/12 — View Item avoids hardcoded black text / white surface bypass in root tokens", () => {
    expect(pdCss).toMatch(/--pd-v1-card-border:\s*1px solid var\(--rvx-border/);
    expect(pdCss).not.toContain("--pd-v1-card-border: var(--pd-v1-card-border)");
    expect(pdCss).toContain("color: var(--pd-v1-text)");
    expect(pdCss).toContain("background: var(--pd-v1-surface-muted)");
  });

  it("13/14 — product images original; no duplicate theme system; no global img filter", () => {
    const rulesOnly = theme.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(theme).toContain(".pd-v1__gallery-main img");
    expect(theme).toContain("filter: none !important");
    expect(rulesOnly).not.toMatch(/html\[data-theme=["']dark["']\]\s+img\s*\{/);
    expect(rulesOnly).not.toContain(".dark img {");
    expect(theme).not.toContain("createTheme(");
    expect(cardTsx).not.toContain("ResizeObserver");
  });

  it("15 — card functionality structure unchanged", () => {
    expect(cardTsx).toContain("showFavorite");
    expect(cardTsx).toContain("formatListingPrice");
    expect(LISTING_CARD_HOMEPAGE_PROPS.showFavorite).toBe(true);
  });
});
