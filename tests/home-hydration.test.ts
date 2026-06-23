import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Home page hydration safety", () => {
  it("keeps HomeHero free of client-only render values", () => {
    const source = readSource("components/home/HomeHero.tsx");

    expect(source).not.toContain('"use client"');
    expect(source).not.toMatch(/Date\.now|Math\.random|crypto\.randomUUID/);
    expect(source).not.toMatch(/typeof window|localStorage|sessionStorage|navigator\./);
  });

  it("uses stable locale formatting in CategoryGridSection", () => {
    const source = readSource("components/home/CategoryGridSection.tsx");

    expect(source).toContain('new Intl.NumberFormat("en-IE")');
    expect(source).not.toMatch(/\.toLocaleString\(\)/);
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

  it("avoids lazy Suspense boundary for recently viewed carousel", () => {
    const source = readSource("components/home/HomeContent.tsx");

    expect(source).toContain('from "@/components/home/HomeRecentlyViewedCarousel"');
    expect(source).not.toContain("lazy(");
    expect(source).not.toContain("<Suspense");
  });
});
