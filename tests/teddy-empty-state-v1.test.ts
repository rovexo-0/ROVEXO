import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TEDDY_EMPTY_STATE_V1 } from "@/lib/empty-state";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Teddy Empty State Engine v1.1 — Static Premium", () => {
  it("ships isolated static module files", () => {
    expect(existsSync(join(process.cwd(), "components/empty-state/TeddyEmptyState.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "components/empty-state/TeddyAnimation.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "public/assets/teddy/teddy-shrug.png"))).toBe(true);
    expect(existsSync(join(process.cwd(), "assets/teddy/teddy_shrug.json"))).toBe(false);
  });

  it("is fully static — no motion constants", () => {
    expect(TEDDY_EMPTY_STATE_V1.version).toBe("1.1");
    expect(TEDDY_EMPTY_STATE_V1.motion).toBe("none");
    expect(TEDDY_EMPTY_STATE_V1.offsetYPx).toBe(50);
  });

  it("TeddyEmptyState accepts only visible and has no animation hooks", () => {
    const source = readSource("components/empty-state/TeddyEmptyState.tsx");
    expect(source).toContain("visible: boolean");
    expect(source).toContain("TeddyAnimation");
    expect(source).not.toContain("useEmptyState");
    expect(source).not.toContain("framer-motion");
    expect(source).not.toContain("results");
    expect(source).not.toContain("supabase");
  });

  it("CSS has zero keyframes, animations, and transitions", () => {
    const css = readSource("components/empty-state/teddy-empty-state.module.css");
    expect(css).not.toMatch(/@keyframes/);
    expect(css).not.toMatch(/animation\s*:/);
    expect(css).not.toMatch(/transition\s*:/);
    expect(css).not.toContain("will-change");
    expect(css).toContain("padding-top: 50px");
  });

  it("TeddyAnimation has no playing/loop props", () => {
    const source = readSource("components/empty-state/TeddyAnimation.tsx");
    expect(source).not.toContain("playing");
    expect(source).not.toContain("bearShrug");
    expect(source).toContain("TEDDY_EMPTY_STATE_V1.assetSrc");
  });

  it("MarketplaceNoProductsEmpty lazy-loads Teddy without engine imports", () => {
    const source = readSource("features/search/components/MarketplaceNoProductsEmpty.tsx");
    expect(source).toContain("TeddyEmptyState");
    expect(source).toContain("dynamic(");
    expect(source).toContain("No products found");
    expect(source).not.toContain("@/lib/search/search-engine");
  });
});
