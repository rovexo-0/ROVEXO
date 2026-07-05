import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROVEXO_LOGO_DIMENSIONS } from "@/components/brand/RovexoLogo";

describe("official header design", () => {
  it("uses compact integrated control height for mobile shell", () => {
    expect(ROVEXO_LOGO_DIMENSIONS.integratedControlHeight).toBe(40);
    expect(ROVEXO_LOGO_DIMENSIONS.compactHeight).toBeGreaterThan(0);
  });

  it("implements Apple-style tap-to-search bar with left icon only", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/header/HeaderSearchBar.tsx"),
      "utf8",
    );
    expect(source).toContain("Search ROVEXO...");
    expect(source).toContain('data-header-search="bar"');
    expect(source).toContain("useSearchOverlayOptional");
    expect(source).toContain('role="search"');
    expect(source).toContain("header-rx-search-bar");
    expect(source).not.toContain("rx-glass");
    expect(source).not.toContain("/assistant");
  });

  it("keeps logo, centered search, messages, notifications and profile on the default top row", () => {
    const source = readFileSync(path.join(process.cwd(), "components/Header.tsx"), "utf8");
    expect(source).toContain("HeaderSearchBar");
    expect(source).toContain("RovexoHeaderMark");
    expect(source).toContain("HeaderActions");
    expect(source).toContain("HeaderProfileLink");
    expect(source).toContain('data-header-version="rovexo-v1"');
    expect(source).toContain("rx-header-premium__search");
    expect(source).toContain("rx-header-premium__row");
  });

  it("promotes Bring Your Item into a two-column homepage header beside search", () => {
    const header = readFileSync(path.join(process.cwd(), "components/Header.tsx"), "utf8");
    const cta = readFileSync(
      path.join(process.cwd(), "components/header/HeaderBringYourItemCta.tsx"),
      "utf8",
    );
    expect(header).toContain('variant?: "default" | "homepage"');
    expect(header).toContain("HeaderBringYourItemCta");
    expect(header).toContain("rx-header-premium__col--search");
    expect(header).toContain("rx-header-premium__col--cta");
    expect(header).not.toContain("RovexoLogoBrand");
    expect(header).toContain('data-header-layout={isHomepage ? "homepage" : "default"}');
    expect(cta).toContain("BRING_YOUR_ITEM_PATH");
    expect(cta).toContain("🚀");
  });
});
