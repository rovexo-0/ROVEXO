import { describe, expect, it } from "vitest";
import {
  attemptHomepageEngineeringRepair,
  BANNER_VALIDATION_CHECKS,
  HOMEPAGE_ENGINEERING_SCORES,
  HOMEPAGE_FULL_SCAN_COMPONENTS,
  HOMEPAGE_PRODUCTION_GATES,
  isHomepageEngineeringPass,
  planHomepageEngineeringRepairs,
  PREMIUM_HOME_STACK,
  runFullHomepageEngineeringScan,
} from "@/lib/homepage-engineering-director";

describe("homepage engineering director registry", () => {
  it("defines full scan components", () => {
    expect(HOMEPAGE_FULL_SCAN_COMPONENTS).toContain("premium-header");
    expect(HOMEPAGE_FULL_SCAN_COMPONENTS).toContain("category-rail");
    expect(HOMEPAGE_FULL_SCAN_COMPONENTS).toContain("bottom-navigation");
    expect(HOMEPAGE_FULL_SCAN_COMPONENTS.length).toBe(14);
  });

  it("defines engineering scores and production gates", () => {
    expect(HOMEPAGE_ENGINEERING_SCORES).toContain("homepage-health");
    expect(HOMEPAGE_ENGINEERING_SCORES).toContain("navigation-integrity");
    expect(HOMEPAGE_ENGINEERING_SCORES.length).toBe(11);
    expect(HOMEPAGE_PRODUCTION_GATES).toContain("typecheck");
    expect(HOMEPAGE_PRODUCTION_GATES).toContain("enterprise-certification");
    expect(HOMEPAGE_PRODUCTION_GATES.length).toBe(12);
  });

  it("defines banner validation checks", () => {
    expect(BANNER_VALIDATION_CHECKS).toContain("rotation");
    expect(BANNER_VALIDATION_CHECKS).toContain("lazy-loading");
  });

  it("defines premium home stack", () => {
    expect(PREMIUM_HOME_STACK).toContain("HomeCategoryRail");
    expect(PREMIUM_HOME_STACK).toContain("HomeHeroBannerEngine");
    expect(PREMIUM_HOME_STACK).not.toContain("CategoryGridSection");
  });
});

describe("homepage engineering director scanner", () => {
  it("passes full homepage engineering scan at 100%", () => {
    const scan = runFullHomepageEngineeringScan();
    expect(scan.status).toBe("pass");
    expect(scan.passPercent).toBe(100);
    expect(scan.completionPercent).toBe(100);
    expect(scan.healthScore).toBe(100);
    expect(scan.navigationIntegrityScore).toBe(100);
    expect(scan.certificationEligible).toBe(true);
    expect(scan.productionReady).toBe(true);
    expect(isHomepageEngineeringPass(scan)).toBe(true);
  });

  it("verifies all homepage components complete", () => {
    const scan = runFullHomepageEngineeringScan();
    expect(scan.components.every((component) => component.complete)).toBe(true);
    expect(scan.legacyViolations).toEqual([]);
  });

  it("verifies all engineering scores at 100%", () => {
    const scan = runFullHomepageEngineeringScan();
    expect(scan.scores.every((score) => score.score >= 100 && score.status === "pass")).toBe(true);
  });

  it("verifies all production gates pass", () => {
    const scan = runFullHomepageEngineeringScan();
    expect(scan.productionGates.every((gate) => gate.passPercent >= 100 && gate.status === "pass")).toBe(true);
  });

  it("plans no repairs when certification eligible", () => {
    const scan = runFullHomepageEngineeringScan();
    const planned = planHomepageEngineeringRepairs(scan);
    expect(planned).toHaveLength(1);
    expect(planned[0]?.action).toBe("noop");
    const repair = attemptHomepageEngineeringRepair(scan, true);
    expect(repair.executed).toEqual([]);
  });
});
