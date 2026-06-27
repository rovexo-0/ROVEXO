import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Home page hydration safety", () => {
  it("keeps HomeHeroBanner free of client-only render values", () => {
    const source = readSource("components/home/HomeHeroBanner.tsx");

    expect(source).toContain('"use client"');
    expect(source).toContain("rx-hero-banner");
    expect(source).not.toMatch(/Date\.now|Math\.random|crypto\.randomUUID/);
  });

  it("uses enterprise HomeCategoryRail on the homepage", () => {
    const homeContent = readSource("components/home/HomeContent.tsx");
    const categoryRail = readSource("components/home/HomeCategoryRail.tsx");

    expect(homeContent).toContain("HomeCategoryRail");
    expect(homeContent).not.toContain("CategoryGridSection");
    expect(categoryRail).toContain("rx-category-rail");
    expect(categoryRail).toContain("rx-category-card");
  });

  it("defers header height measurement to layout effects", () => {
    const scrollSource = readSource("components/home/MobileHeaderScrollContext.tsx");
    const headerSource = readSource("components/Header.tsx");

    expect(scrollSource).toContain("useLayoutEffect");
    expect(scrollSource).toContain("setHeaderElement");
    expect(scrollSource).not.toContain("headerElementRef");
    expect(headerSource).toContain("useLayoutEffect");
    expect(headerSource).toContain("headerRef");
    expect(headerSource).not.toContain("setHeaderRef");
  });

  it("keeps HomeContent free of lazy Suspense boundaries", () => {
    const source = readSource("components/home/HomeContent.tsx");

    expect(source).not.toContain("lazy(");
    expect(source).not.toContain("<Suspense");
    expect(source).toContain("HomeHeroBannerEngine");
  });
});
