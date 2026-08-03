import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CROSS_BROWSER_CERTIFICATION_CONTRACT,
  CROSS_BROWSER_CERTIFICATION_ID,
  CROSS_BROWSER_CERTIFICATION_VERSION,
  CROSS_BROWSER_MATRIX_CELL_COUNT,
  CROSS_BROWSER_PAGES,
  CROSS_BROWSER_PAD_CONTRACT,
  CROSS_BROWSER_TARGETS,
  assertCrossBrowserCertificationOrBlock,
  emptyCrossBrowserEvidence,
  evaluateCrossBrowserCertification,
  getCrossBrowserPlaywrightProjectNames,
} from "@/lib/cross-browser/cross-browser-certification-engine-v1";

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Cross Browser Certification Engine v1.0 — SSOT lock", () => {
  it("locks engine identity + Preview Release gate", () => {
    expect(CROSS_BROWSER_CERTIFICATION_ID).toBe("CROSS_BROWSER_CERTIFICATION_ENGINE");
    expect(CROSS_BROWSER_CERTIFICATION_VERSION).toBe("v1.0");
    expect(CROSS_BROWSER_CERTIFICATION_CONTRACT.mandatoryBeforePreviewRelease).toBe(true);
    expect(CROSS_BROWSER_PAD_CONTRACT.leftPx).toBe(16);
    expect(CROSS_BROWSER_PAD_CONTRACT.rightPx).toBe(16);
  });

  it("covers required desktop + mobile + tablet browsers", () => {
    const ids = CROSS_BROWSER_TARGETS.map((t) => t.id);
    expect(ids).toContain("chrome-desktop");
    expect(ids).toContain("edge-desktop");
    expect(ids).toContain("firefox-desktop");
    expect(ids).toContain("safari-desktop");
    expect(ids).toContain("safari-ios-iphone-se");
    expect(ids).toContain("safari-ios-iphone-13");
    expect(ids).toContain("safari-ios-iphone-15");
    expect(ids).toContain("safari-ios-iphone-15-pro-max");
    expect(ids).toContain("safari-ios-iphone-latest");
    expect(ids).toContain("chrome-ios-iphone-15");
    expect(ids).toContain("chrome-ios-iphone-latest");
    expect(ids).toContain("chrome-android-pixel");
    expect(ids).toContain("chrome-android-samsung");
    expect(ids).toContain("chrome-android-fold");
    expect(ids).toContain("samsung-internet-galaxy");
    expect(ids).toContain("ipad-safari");
    expect(ids).toContain("android-tablet-chrome");
  });

  it("covers required marketplace pages", () => {
    const ids = CROSS_BROWSER_PAGES.map((p) => p.id);
    for (const required of [
      "homepage",
      "search",
      "categories",
      "listing",
      "view_item",
      "seller_profile",
      "buyer_profile",
      "messages",
      "offers",
      "bundle",
      "checkout",
      "orders",
      "wallet",
      "tracking",
      "notifications",
    ]) {
      expect(ids).toContain(required);
    }
  });

  it("matrix cell count = targets × pages", () => {
    expect(CROSS_BROWSER_MATRIX_CELL_COUNT).toBe(
      CROSS_BROWSER_TARGETS.length * CROSS_BROWSER_PAGES.length,
    );
  });

  it("fail-closed without runtime evidence", () => {
    const verdict = evaluateCrossBrowserCertification(null);
    expect(verdict.pass).toBe(false);
    expect(verdict.overall).toBe("UNVERIFIED");
    expect(verdict.mandatoryBeforePreviewRelease).toBe(true);
    expect(() => assertCrossBrowserCertificationOrBlock(null)).toThrow(/Preview Release FORBIDDEN/);
  });

  it("empty evidence is never PASS", () => {
    const empty = emptyCrossBrowserEvidence();
    expect(empty.overall).toBe("UNVERIFIED");
    expect(evaluateCrossBrowserCertification(empty).pass).toBe(false);
  });

  it("wires Playwright projects + runner + spec (singularity)", () => {
    const projects = read("scripts/playwright-cross-browser-projects.mjs");
    const allProjects = read("scripts/playwright-projects.mjs");
    const runner = read("scripts/run-cross-browser-certification.mjs");
    const spec = read("e2e/cross-browser-certification.spec.ts");
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };

    for (const name of getCrossBrowserPlaywrightProjectNames()) {
      expect(projects).toContain(name);
    }
    expect(allProjects).toContain("buildCrossBrowserCertificationProjects");
    expect(runner).toContain("CROSS BROWSER CERTIFICATION ENGINE");
    expect(spec).toContain("Cross Browser Certification Engine v1.0");
    expect(pkg.scripts["test:e2e:cross-browser"]).toContain("run-cross-browser-certification");
    expect(existsSync(join(process.cwd(), ".cursor/rules/cross-browser-certification-v1.mdc"))).toBe(
      true,
    );
  });
});
