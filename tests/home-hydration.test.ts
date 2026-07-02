import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Home page hydration safety", () => {
  it("uses approved RovexoCategoryRail on the homepage", () => {
    const homePage = readSource("components/home/RovexoHomePage.tsx");
    const categoryRail = readSource("components/home/RovexoCategoryRail.tsx");

    expect(homePage).toContain("RovexoCategoryRail");
    expect(homePage).not.toContain("CategoryGridSection");
    expect(categoryRail).toContain("home-v1-category");
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

  it("keeps the v1 homepage sections statically composed", () => {
    const source = readSource("components/home/RovexoHomePage.tsx");

    expect(source).not.toContain("<Suspense");
    expect(source).not.toContain("HomeHeroBannerEngine");
    expect(source).not.toContain("HeroCategorySyncProvider");
    expect(source).toContain("home-v1-main");
  });
});
