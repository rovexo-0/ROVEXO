import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROVEXO_LOGO_DIMENSIONS } from "@/components/brand/RovexoLogo";
import { HOMEPAGE_SHARE } from "@/lib/share/homepage";

describe("official header design", () => {
  it("uses compact integrated control height for mobile shell", () => {
    expect(ROVEXO_LOGO_DIMENSIONS.integratedControlHeight).toBe(40);
  });

  it("navigates Homepage search field to /search (SEARCH_UI_v1.0 SSOT)", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/home/HomepageSearchField.tsx"),
      "utf8",
    );

    expect(source).toContain('router.push("/search")');
    expect(source).toContain("SearchBarSearchIcon");
    expect(source).toContain('role="search"');
    expect(source).not.toContain("searchOverlay.open");
    expect(source).not.toContain("useDebouncedValue");
    expect(source).not.toContain("homepage-search__suggestions");
  });

  it("keeps search-first full-width bar — no notification or avatar in header", () => {
    const source = readFileSync(path.join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");

    expect(source).toContain("HomepageSearchField");
    expect(source).toContain('data-header-version="rovexo-v2"');
    expect(source).toContain('data-header-search-first="true"');
    expect(source).toContain("ROVEXO");
    expect(source).not.toContain("/account/settings");
    expect(source).not.toContain("RovexoIcons.settings");
    expect(source).not.toContain("lucide-react");
    expect(source).not.toContain("MessageSquare");
    expect(source).not.toContain('href="/messages"');
    expect(source).not.toContain("BellLineIcon");
    expect(source).not.toContain("HeaderProfileLink");
    expect(source).not.toContain("HomepageHeaderShareButton");
    expect(source).not.toContain("useHeaderBadges");
  });

  it("mounts category rail below header search on homepage", () => {
    const homePage = readFileSync(path.join(process.cwd(), "components/homepage/canonical/CanonicalHomepage.tsx"), "utf8");
    const header = readFileSync(path.join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");
    expect(homePage).toContain("CanonicalCategoryRail");
    expect(homePage).not.toContain("HomepageV4Search");
    expect(header).toContain("HomepageSearchField");
    expect(header).toContain("rx-h2__search");
  });

  it("no longer renders the Bring Your Item / Start Selling banner on the homepage", () => {
    const homePage = readFileSync(path.join(process.cwd(), "components/homepage/canonical/CanonicalHomepage.tsx"), "utf8");

    expect(homePage).not.toContain("CanonicalBringYourItem");
  });

  it("routes marketplace through HeaderProvider identical chrome (no per-page header)", () => {
    const page = readFileSync(path.join(process.cwd(), "app/(platform)/page.tsx"), "utf8");
    const header = readFileSync(path.join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");
    const provider = readFileSync(path.join(process.cwd(), "features/header/HeaderProvider.tsx"), "utf8");
    const chrome = readFileSync(
      path.join(process.cwd(), "components/layout/PlatformChromeProviders.tsx"),
      "utf8",
    );
    expect(chrome).toContain("HeaderProvider");
    expect(provider).toContain('layout="default"');
    expect(provider).toContain("SEARCH_PRIORITY_FREEZE_V1");
    expect(page).not.toMatch(/<RovexoHeaderV2[\s/>]/);
    expect(page).not.toContain("HomepageV3Header");
    expect(header).toContain('data-header-search-first="true"');
    expect(header).toContain("ROVEXO");
    expect(page).toContain("openGraph");
    expect(page).toContain("twitter");
    expect(page).toContain("canonical");
  });

  it("defines homepage share payload for Web Share and fallback channels", () => {
    expect(HOMEPAGE_SHARE.title).toBe("ROVEXO – Buy & Sell with Confidence");
    expect(HOMEPAGE_SHARE.text).toContain("trusted sellers");
    expect(HOMEPAGE_SHARE.url).toBe("https://www.rovexo.co.uk");

    const button = readFileSync(
      path.join(process.cwd(), "components/header/HomepageHeaderShareButton.tsx"),
      "utf8",
    );
    expect(button).toContain('aria-label="Share"');
    expect(button).toContain("navigator.share");
    expect(button).toContain("Link copied");
    expect(button).toContain("WhatsApp");
    expect(button).toContain("Facebook");
    expect(button).toContain("Messenger");
    expect(button).toContain("Telegram");
    expect(button).toContain("Email");
    expect(button).toContain("More Apps");
  });
});
