import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROVEXO_LOGO_DIMENSIONS } from "@/components/brand/RovexoLogo";

describe("official header design", () => {
  it("uses compact integrated control height for mobile shell", () => {
    expect(ROVEXO_LOGO_DIMENSIONS.integratedControlHeight).toBe(40);
    expect(ROVEXO_LOGO_DIMENSIONS.compactHeight).toBeGreaterThan(0);
  });

  it("implements homepage search bar with form action to /search", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/home/RovexoSearchBar.tsx"),
      "utf8",
    );
    expect(source).toContain("Search for anything...");
    expect(source).toContain('action="/search"');
    expect(source).toContain("home-v1-search-bar");
    expect(source).toContain("RovexoIcon");
  });

  it("keeps logo, centered search, messages, notifications and profile on the same top row", () => {
    const source = readFileSync(path.join(process.cwd(), "components/Header.tsx"), "utf8");
    expect(source).toContain("HeaderSearchBar");
    expect(source).toContain("RovexoHeaderMark");
    expect(source).toContain("HeaderActions");
    expect(source).toContain("HeaderProfileLink");
    expect(source).toContain('data-header-version="rovexo-v1"');
    expect(source).toContain("rx-header-shell__search");
  });
});
