import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROVEXO_LOGO_DIMENSIONS } from "@/components/brand/RovexoLogo";
import { HOMEPAGE_SHARE } from "@/lib/share/homepage";

describe("official header design", () => {
  it("uses compact integrated control height for mobile shell", () => {
    expect(ROVEXO_LOGO_DIMENSIONS.integratedControlHeight).toBe(40);
  });

  it("implements debounced homepage search with suggestions and clear control", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/home/HomepageSearchField.tsx"),
      "utf8",
    );

    expect(source).toContain("useDebouncedValue");
    expect(source).toContain('role="search"');
  });

  it("keeps logo, integrated search, notifications only in header actions", () => {
    const source = readFileSync(path.join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");

    expect(source).toContain("HomepageSearchField");
    expect(source).toContain('data-header-version="rovexo-v2"');
    expect(source).not.toContain("/account/settings");
    expect(source).not.toContain("RovexoIcons.settings");
    expect(source).toContain("lucide-react");
    expect(source).not.toContain("MessageSquare");
    expect(source).not.toContain('href="/messages"');
    expect(source).toContain("Bell");
    expect(source).toContain("HeaderProfileLink");
    expect(source).toContain("HomepageHeaderShareButton");
    expect(source).toContain("replaceAccountWithShare");
  });

  it("mounts category rail below header search on homepage", () => {
    const homePage = readFileSync(path.join(process.cwd(), "components/homepage/canonical/CanonicalHomepage.tsx"), "utf8");
    const header = readFileSync(path.join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");
    expect(homePage).toContain("CanonicalCategoryRail");
    expect(homePage).not.toContain("HomepageV4Search");
    expect(header).toContain("rx-h2__search-row");
  });

  it("no longer renders the Bring Your Item / Start Selling banner on the homepage", () => {
    const homePage = readFileSync(path.join(process.cwd(), "components/homepage/canonical/CanonicalHomepage.tsx"), "utf8");

    expect(homePage).not.toContain("CanonicalBringYourItem");
  });

  it("routes the homepage through RovexoHeaderV2 without header profile avatar", () => {
    const page = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
    const header = readFileSync(path.join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");
    expect(page).toContain("RovexoHeaderV2");
    expect(page).toContain('layout="homepage"');
    expect(page).not.toContain("replaceAccountWithShare");
    expect(page).not.toContain("HomepageV3Header");
    expect(header).toContain("!isHomepageLayout");
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
