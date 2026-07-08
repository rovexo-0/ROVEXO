import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";

import path from "node:path";

import { ROVEXO_LOGO_DIMENSIONS } from "@/components/brand/RovexoLogo";

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

  it("keeps logo, integrated search, messages, notifications and account on the header row", () => {
    const source = readFileSync(path.join(process.cwd(), "components/header/RovexoHeaderV2.tsx"), "utf8");

    expect(source).toContain("HomepageSearchField");
    expect(source).toContain('data-header-version="rovexo-v2"');
    expect(source).not.toContain("/account/settings");
    expect(source).not.toContain("RovexoIcons.settings");
    expect(source).toContain("lucide-react");
    expect(source).toContain("MessageSquare");
    expect(source).toContain("Bell");
    expect(source).toContain("HeaderProfileLink");
  });

  it("mounts category rail in the homepage main column (search lives in header)", () => {
    const homePage = readFileSync(path.join(process.cwd(), "components/homepage/canonical/CanonicalHomepage.tsx"), "utf8");
    expect(homePage).toContain("CanonicalCategoryRail");
    expect(homePage).not.toContain("HomepageV4Search");
  });

  it("no longer renders the Bring Your Item / Start Selling banner on the homepage", () => {
    const homePage = readFileSync(path.join(process.cwd(), "components/homepage/canonical/CanonicalHomepage.tsx"), "utf8");

    expect(homePage).not.toContain("CanonicalBringYourItem");
  });

  it("routes the homepage through RovexoHeaderV2", () => {
    const page = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
    expect(page).toContain("RovexoHeaderV2");
    expect(page).not.toContain("HomepageV3Header");
  });
});
