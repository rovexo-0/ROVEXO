import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Homepage enterprise migration contract", () => {
  it("renders RovexoHomePage from the official component stack", () => {
    const page = readSource("app/page.tsx");
    const homePage = readSource("components/home/RovexoHomePage.tsx");

    expect(page).toContain("RovexoHomePage");
    expect(page).toContain("RovexoHeader");
    expect(page).toContain("BetaAppShell");
    expect(page).not.toContain("HomeContent");
    expect(page).not.toContain("PremiumHomePage");

    expect(homePage).toContain("RovexoCategoryRail");
    expect(homePage).toContain("RovexoBanner");
    expect(homePage).toContain("RovexoFeaturedListings");
    expect(homePage).toContain("RovexoAllListings");
  });

  it("keeps the approved homepage section order", () => {
    const homePage = readSource("components/home/RovexoHomePage.tsx");

    const categoryIndex = homePage.indexOf("<RovexoCategoryRail");
    const bannerIndex = homePage.indexOf("<RovexoBanner");
    const featuredIndex = homePage.indexOf("<RovexoFeaturedListings");
    const recommendedIndex = homePage.indexOf("<RovexoRecommendedListings");
    const businessesIndex = homePage.indexOf("<RovexoBusinesses");
    const allListingsIndex = homePage.indexOf("<RovexoAllListings");

    expect(categoryIndex).toBeGreaterThan(-1);
    expect(bannerIndex).toBeGreaterThan(categoryIndex);
    expect(featuredIndex).toBeGreaterThan(bannerIndex);
    expect(recommendedIndex).toBeGreaterThan(featuredIndex);
    expect(businessesIndex).toBeGreaterThan(recommendedIndex);
    expect(allListingsIndex).toBeGreaterThan(businessesIndex);
  });

  it("wires scroll-hide chrome through the root app shell", () => {
    const layout = readSource("app/layout.tsx");
    const appShell = readSource("components/layout/AppShellLayout.tsx");
    const scrollProvider = readSource("components/layout/AppChromeScrollProvider.tsx");
    const betaShell = readSource("components/beta/BetaAppShell.tsx");

    expect(layout).toContain("AppShellLayout");
    expect(appShell).toContain("AppChromeScrollProvider");
    expect(scrollProvider).toContain("RovexoMobileHeaderScrollProvider");
    expect(betaShell).toContain("RovexoFooterNavigation");
    expect(betaShell).not.toContain("RovexoMobileHeaderScrollProvider");
  });
});
