import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ACCESSIBILITY_AXE_TAGS,
  ACCESSIBILITY_CERTIFICATION_CONTRACT,
  ACCESSIBILITY_CERTIFICATION_ID,
  ACCESSIBILITY_PAGES,
  assertAccessibilityCertificationOrBlock,
  emptyAccessibilityEvidence,
  evaluateAccessibilityCertification,
} from "@/lib/accessibility/accessibility-certification-engine-v1";

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Accessibility Certification Engine v1.0 — SSOT lock", () => {
  it("locks WCAG 2.2 AA · no disabled rules · no skip pages", () => {
    expect(ACCESSIBILITY_CERTIFICATION_ID).toBe("ACCESSIBILITY_CERTIFICATION_ENGINE");
    expect(ACCESSIBILITY_CERTIFICATION_CONTRACT.wcagTarget).toBe("WCAG 2.2 AA");
    expect(ACCESSIBILITY_AXE_TAGS).toContain("wcag22aa");
    expect(ACCESSIBILITY_CERTIFICATION_CONTRACT.forbidden).toContain("disable_axe_rules");
    expect(ACCESSIBILITY_CERTIFICATION_CONTRACT.forbidden).toContain("skip_pages");
    expect(ACCESSIBILITY_CERTIFICATION_CONTRACT.forbidden).toContain("fake_pass");
  });

  it("covers Owner platform pages including Sell · Settings · Review Bundle · Auth", () => {
    const ids = ACCESSIBILITY_PAGES.map((p) => p.id);
    for (const required of [
      "homepage",
      "search",
      "view_item",
      "sell",
      "settings",
      "review_bundle",
      "checkout",
      "wallet",
      "orders",
      "login",
      "register",
    ]) {
      expect(ids).toContain(required);
    }
  });

  it("wires runner + e2e + helper on disk", () => {
    expect(existsSync(join(process.cwd(), "scripts/run-accessibility-certification.mjs"))).toBe(
      true,
    );
    expect(existsSync(join(process.cwd(), "e2e/accessibility-certification.spec.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "e2e/helpers/accessibility-certification.ts"))).toBe(
      true,
    );
    expect(read("package.json")).toContain("test:e2e:accessibility");
    const helper = read("e2e/helpers/accessibility-certification.ts");
    const spec = read("e2e/accessibility-certification.spec.ts");
    expect(helper).not.toMatch(/\.disableRules\s*\(/);
    expect(spec).not.toMatch(/\.disableRules\s*\(/);
  });

  it("fail-closed when evidence unverified", () => {
    const empty = emptyAccessibilityEvidence();
    expect(evaluateAccessibilityCertification(empty).pass).toBe(false);
    expect(() => assertAccessibilityCertificationOrBlock(empty)).toThrow(/BLOCKED/);
  });
});
