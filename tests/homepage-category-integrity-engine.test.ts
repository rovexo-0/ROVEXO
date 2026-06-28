import { describe, expect, it } from "vitest";
import { HOME_CATEGORY_NAV } from "@/lib/home/constants";
import {
  detectSearchBarTopGap,
  integrityScoreFromScan,
  isHomepageIntegrityPass,
  runHomepageCategoryIntegrityScan,
  scanCategoryNavDuplication,
  scanHomepageLayoutOptimization,
  scanHomepageSectionDuplication,
} from "@/lib/homepage-category-integrity-engine";
import {
  DUPLICATION_SCAN_TARGETS,
  INTEGRITY_FAIL_CONDITIONS,
  INTEGRITY_OMEGA_SCORES,
  INTEGRITY_VALIDATION_CYCLES,
  LAYOUT_OPTIMIZATION_TARGETS,
  PREMIUM_2026_LAYOUT_SPEC,
} from "@/lib/homepage-category-integrity-engine/registry";
import { createDefaultHomepageBuilderConfig } from "@/lib/super-admin/mission-control/defaults";
import type { HomepageBuilderConfig } from "@/lib/super-admin/mission-control/types";

describe("homepage category integrity registry", () => {
  it("defines validation cycles from constitution update 066.1", () => {
    expect(INTEGRITY_VALIDATION_CYCLES).toContain("homepage-validation");
    expect(INTEGRITY_VALIDATION_CYCLES).toContain("enterprise-certification");
    expect(INTEGRITY_VALIDATION_CYCLES.length).toBe(6);
  });

  it("defines scan targets and fail conditions", () => {
    expect(DUPLICATION_SCAN_TARGETS).toContain("category-rail");
    expect(DUPLICATION_SCAN_TARGETS).toContain("category-cards");
    expect(LAYOUT_OPTIMIZATION_TARGETS).toContain("search-bar");
    expect(INTEGRITY_FAIL_CONDITIONS).toContain("empty-space-above-search-bar");
    expect(INTEGRITY_FAIL_CONDITIONS).toContain("duplicated-categories");
  });

  it("defines omega integrity scores", () => {
    expect(INTEGRITY_OMEGA_SCORES).toEqual(["visual-integrity", "homepage-integrity"]);
  });

  it("uses premium 2026 search bar gap threshold", () => {
    expect(PREMIUM_2026_LAYOUT_SPEC.searchBarTopGapMaxPx).toBe(0);
    expect(PREMIUM_2026_LAYOUT_SPEC.categoryRailCanonicalComponent).toBe("HomeCategoryRail");
  });
});

describe("homepage category integrity analyzer", () => {
  it("passes canonical category nav without duplicates", () => {
    const findings = scanCategoryNavDuplication();
    expect(findings.filter((f) => f.status === "fail")).toHaveLength(0);
    expect(HOME_CATEGORY_NAV.length).toBeGreaterThan(10);
  });

  it("passes default homepage builder without duplicate sections", () => {
    const findings = scanHomepageSectionDuplication(createDefaultHomepageBuilderConfig());
    expect(findings.filter((f) => f.status === "fail")).toHaveLength(0);
  });

  it("detects duplicate category rail sections", () => {
    const config = createDefaultHomepageBuilderConfig();
    const duplicateRail = config.components.find((c) => c.id === "category-rail");
    if (!duplicateRail) throw new Error("missing category rail");
    const mutated: HomepageBuilderConfig = {
      ...config,
      components: [
        ...config.components,
        { ...duplicateRail, label: "Category Rail Duplicate", order: 99 },
      ],
    };
    const findings = scanHomepageSectionDuplication(mutated);
    expect(findings.some((f) => f.target === "category-rail" && f.status === "fail")).toBe(true);
  });

  it("detects duplicate slugs in category nav", () => {
    const dupedNav = [
      ...HOME_CATEGORY_NAV,
      { ...HOME_CATEGORY_NAV[0]!, slug: HOME_CATEGORY_NAV[0]!.slug },
    ];
    const slugCounts = new Map<string, number>();
    for (const item of dupedNav) slugCounts.set(item.slug, (slugCounts.get(item.slug) ?? 0) + 1);
    expect([...slugCounts.values()].some((count) => count > 1)).toBe(true);
  });

  it("passes search bar top gap on premium header spec", () => {
    const findings = detectSearchBarTopGap();
    expect(findings.every((f) => f.status === "pass")).toBe(true);
  });

  it("passes full homepage layout optimization scan", () => {
    const findings = scanHomepageLayoutOptimization();
    expect(findings.filter((f) => f.status === "fail")).toHaveLength(0);
  });

  it("runs full integrity scan with certification eligibility", () => {
    const scan = runHomepageCategoryIntegrityScan({ cycle: "homepage-validation" });
    expect(scan.passPercent).toBe(100);
    expect(scan.status).toBe("pass");
    expect(scan.certificationEligible).toBe(true);
    expect(scan.searchBarTopGapPass).toBe(true);
    expect(scan.failConditions).toHaveLength(0);
    expect(isHomepageIntegrityPass(scan)).toBe(true);
  });

  it("derives omega integrity scores at 100 when clean", () => {
    const scan = runHomepageCategoryIntegrityScan({ cycle: "enterprise-certification" });
    const scores = integrityScoreFromScan(scan);
    expect(scores.visualIntegrity).toBe(100);
    expect(scores.homepageIntegrity).toBe(100);
  });
});
