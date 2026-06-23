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
    expect(source).toContain('href="/search"');
    expect(source).toContain("header-search-bar-2026");
    expect(source).not.toContain("premium-glass");
    expect(source).not.toContain("/assistant");
  });

  it("keeps logo, centered search, messages, notifications and profile on the same top row", () => {
    const source = readFileSync(path.join(process.cwd(), "components/Header.tsx"), "utf8");
    expect(source).toContain("HeaderSearchBar");
    expect(source).toContain("RovexoLogo");
    expect(source).toContain("HeaderActions");
    expect(source).toContain("HeaderProfileLink");
    expect(source).toContain('data-header-version="premium-2026"');
    expect(source).toContain("header-premium-2026__search");
  });
});
