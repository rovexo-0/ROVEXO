import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Home page hydration safety", () => {
  it("keeps RovexoHomePage free of lazy Suspense boundaries", () => {
    const source = readSource("components/home/RovexoHomePage.tsx");

    expect(source).not.toContain("lazy(");
    expect(source).not.toContain("<Suspense");
    expect(source).toContain("RovexoCategoryRail");
  });

  it("uses RovexoCategoryRail on the homepage", () => {
    const homePage = readSource("components/home/RovexoHomePage.tsx");
    const categoryRail = readSource("components/home/RovexoCategoryRail.tsx");

    expect(homePage).toContain("RovexoCategoryRail");
    expect(categoryRail).toContain("RovexoCategoryCard");
  });

  it("defers header height measurement to layout effects", () => {
    const scrollSource = readSource("components/home/RovexoMobileHeaderScrollContext.tsx");
    const headerSource = readSource("components/home/RovexoHeader.tsx");

    expect(scrollSource).toContain("useLayoutEffect");
    expect(scrollSource).toContain("setHeaderElement");
    expect(scrollSource).not.toContain("headerElementRef");
    expect(headerSource).toContain('"use client"');
  });
});
