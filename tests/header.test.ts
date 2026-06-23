import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROVEXO_LOGO_DIMENSIONS } from "@/components/brand/RovexoLogo";

describe("official header design", () => {
  it("uses compact integrated control height for mobile shell", () => {
    expect(ROVEXO_LOGO_DIMENSIONS.integratedControlHeight).toBe(40);
    expect(ROVEXO_LOGO_DIMENSIONS.compactHeight).toBeGreaterThan(0);
  });

  it("implements premium glass search bar with assistant actions", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/header/HeaderSearchBar.tsx"),
      "utf8",
    );
    expect(source).toContain("Search for anything...");
    expect(source).toContain('data-header-search="bar"');
    expect(source).toContain("openSearchOverlay");
    expect(source).toContain("/assistant");
    expect(source).toContain("premium-glass");
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
