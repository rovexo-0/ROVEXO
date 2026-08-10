import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const THEME_CSS = "styles/rovexo/black-underground-theme-v1.css";
const LANDING = "features/search/components/SearchLandingView.tsx";
const SEARCH_CSS = "styles/rovexo/search-landing-v1.css";
const CATEGORY_CSS = "styles/rovexo/category-rail.css";
const LISTING_CARD = "components/ui/ListingCard.tsx";
const LISTING_CSS = "components/ui/ListingCard.module.css";
const BANNER = "components/profile/ProfileFooterBanner.tsx";
const BANNER_CSS = "styles/rovexo/account-canonical-v2.css";
const HEADER_CSS = "styles/rovexo/header-v2.css";

/** Strip CSS / JS block comments so audit ignores documentation mentions of forbidden APIs. */
function stripComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** Collect CSS filter-like property values (filter / backdrop-filter variants). */
function collectFilterLikeValues(css: string): string[] {
  const body = stripComments(css);
  const values: string[] = [];
  const re =
    /(?:^|[^a-zA-Z0-9_-])(?:-webkit-)?(?:backdrop-)?filter\s*:\s*([^;!}{]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    values.push(match[1].trim());
  }
  return values;
}

function assertOnlyNoneFilters(css: string, label: string) {
  const values = collectFilterLikeValues(css);
  for (const value of values) {
    expect(value, `${label} unexpected filter value: ${value}`).toBe("none");
  }
}

describe("COD SÂNGE — Black Underground final visual correction", () => {
  it("removes View all from Browse Categories (keeps section + cards)", () => {
    const landing = readSource(LANDING);
    const browseBlock = landing.slice(
      landing.indexOf("BrowseCategoriesGrid"),
      landing.indexOf("TrendingSearchesSection"),
    );
    expect(browseBlock).toContain("Browse categories");
    expect(browseBlock).toContain("SearchCategoryBrowseCard");
    expect(browseBlock).not.toContain("View all");
    expect(browseBlock).not.toContain('href="/categories"');
    expect(browseBlock).not.toContain("srch-land__section-action");
  });

  it("forbids global dark-theme image filters", () => {
    const theme = readSource(THEME_CSS);
    assertOnlyNoneFilters(theme, THEME_CSS);
    const body = stripComments(theme);
    // Forbidden: blanket img filters under dark theme
    expect(body).not.toMatch(/html\[data-theme=["']dark["']\]\s+img\s*\{/);
    expect(body).not.toMatch(/\.dark\s+img\s*\{/);
    expect(body).not.toMatch(/body\.dark\s+img\s*\{/);
  });

  it("Black Underground CSS has no blur / backdrop blur / image-altering filters", () => {
    const theme = readSource(THEME_CSS);
    assertOnlyNoneFilters(theme, THEME_CSS);
    const body = stripComments(theme);
    expect(body).not.toMatch(/blur\s*\(/);
    expect(body).not.toMatch(/brightness\s*\(/);
    expect(body).not.toMatch(/contrast\s*\(/);
    expect(body).not.toMatch(/saturate\s*\(/);
    expect(body).not.toMatch(/grayscale\s*\(/);

    const blendValues: string[] = [];
    const blendRe = /(?:mix-blend-mode|background-blend-mode)\s*:\s*([^;!}{]+)/g;
    let blendMatch: RegExpExecArray | null;
    while ((blendMatch = blendRe.exec(body)) !== null) {
      blendValues.push(blendMatch[1].trim());
    }
    for (const value of blendValues) {
      expect(value, `unexpected blend mode: ${value}`).toBe("normal");
    }
  });

  it("protects product / listing / category / logo / banner images from theme filters", () => {
    const theme = readSource(THEME_CSS);
    expect(theme).toContain("filter: none !important");
    expect(theme).toContain('[data-listing-card="rovexo"] img');
    expect(theme).toContain(".srch-land__cat-img");
    expect(theme).toContain(".rx-category-render__img");
    expect(theme).toContain(".rx-h2__logo-img");
    expect(theme).toContain(".profile-footer-banner__img");
    expect(theme).toContain(".inbox-hub img");
  });

  it("category images have no drop-shadow / blur filters", () => {
    const searchCss = stripComments(readSource(SEARCH_CSS));
    const categoryCss = stripComments(readSource(CATEGORY_CSS));
    expect(searchCss).toMatch(/\.srch-land__cat-img\s*\{[^}]*filter:\s*none/);
    expect(searchCss).not.toMatch(/\.srch-land__cat-img\s*\{[^}]*drop-shadow/);
    expect(categoryCss).toMatch(/\.rx-category-render__img\s*\{[^}]*filter:\s*none/);
    expect(categoryCss).not.toMatch(/\.rx-category-render__img\s*\{[^}]*drop-shadow/);
  });

  it("RX logo and ROVEXO banner declare no filter (canonical assets)", () => {
    const header = stripComments(readSource(HEADER_CSS));
    const bannerCss = stripComments(readSource(BANNER_CSS));
    const banner = readSource(BANNER);
    expect(header).toMatch(/\.rx-h2__logo-img\s*\{[^}]*filter:\s*none/);
    expect(bannerCss).toMatch(/\.profile-footer-banner__img[\s\S]*?filter:\s*none/);
    expect(banner).toContain('PROFILE_FOOTER_BANNER_SRC = "/images/profile/profile-footer-banner.png"');
    expect(banner).toContain("SafeImage");
    expect(banner).not.toContain("filter:");
    expect(banner).not.toContain("blur");
  });

  it("ListingCard image pipeline is untouched (SafeImage, no theme filter in module)", () => {
    const card = readSource(LISTING_CARD);
    const css = stripComments(readSource(LISTING_CSS));
    expect(card).toContain("SafeImage");
    expect(card).toContain("data-listing-card");
    expect(css).toMatch(/\.visual img[\s\S]*?filter:\s*none\s*!important/);
    expect(css).not.toMatch(/filter\s*:\s*blur\s*\(/);
    expect(css).not.toMatch(/filter\s*:\s*brightness\s*\(/);
    expect(css).not.toMatch(/mix-blend-mode/);
    expect(css).toContain("object-fit: cover");
  });

  it("Inbox / notification / offer / counter / bundle thumbnails stay SafeImage-original", () => {
    const inboxThumb = readSource("tests/inbox-notification-listing-thumb.test.ts");
    expect(inboxThumb).toContain("listing thumbnails");
    expect(inboxThumb).toContain("SafeImage");

    const theme = readSource(THEME_CSS);
    expect(theme).toContain(".inbox-hub img");
    expect(theme).toContain("[data-notification] img");
    expect(theme).toContain("[data-offer] img");
    expect(theme).toContain("[data-counter-offer] img");
    expect(theme).toContain("[data-bundle] img");
  });

  it("listing card chrome may theme; image class selectors do not apply filters", () => {
    const theme = stripComments(readSource(THEME_CSS));
    expect(theme).toContain('[data-listing-card="rovexo"]');
    expect(theme).toContain("box-shadow: none !important");
    expect(theme).not.toMatch(/rx-listing-card__image[\s\S]{0,80}filter\s*:\s*(?!none)/);
  });
});
