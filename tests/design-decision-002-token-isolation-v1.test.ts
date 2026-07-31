import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DESIGN_DECISION_002_FORBIDDEN,
  DESIGN_DECISION_002_LAW,
  DESIGN_DECISION_002_STATUS,
  HOMEPAGE_LAYOUT_TOKENS,
  INTERNAL_LAYOUT_TOKENS,
  designDecision002Snapshot,
} from "@/lib/design-system/design-decision-002-token-isolation-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("DESIGN DECISION #002 — Dual Layout Token Isolation", () => {
  it("locks never-inherit law and dual families", () => {
    expect(DESIGN_DECISION_002_STATUS).toBe("APPROVED");
    expect(DESIGN_DECISION_002_LAW).toBe("NEVER_INHERIT");
    expect(HOMEPAGE_LAYOUT_TOKENS.padXPx).toBe(16);
    expect(HOMEPAGE_LAYOUT_TOKENS.headerPadXPx).toBe(24);
    expect(INTERNAL_LAYOUT_TOKENS.padXPx).toBe(16);
    expect(HOMEPAGE_LAYOUT_TOKENS.cssVars).toContain("--homepage-pad-x");
    expect(INTERNAL_LAYOUT_TOKENS.cssVars).toContain("--fw-pad-x");
    expect(HOMEPAGE_LAYOUT_TOKENS.neverInheritFrom).toContain("--fw-pad-x");
    expect(INTERNAL_LAYOUT_TOKENS.neverInheritFrom).toContain("--homepage-pad-x");
    expect(designDecision002Snapshot().forbidden).toEqual([...DESIGN_DECISION_002_FORBIDDEN]);
  });

  it("CSS declares both families without cross-family bridges", () => {
    const css = readSource("styles/rovexo/full-width-engine-v1.css");
    expect(css).toContain("--homepage-pad-x: 24px");
    expect(css).toContain("--hp-shell-pad: 16px");
    expect(css).toContain("--internal-pad-x: 16px");
    expect(css).toContain("--fw-pad-x: 16px");
    expect(css).toContain("DESIGN DECISION #002");
    expect(css).not.toMatch(/--rx-phone-inset-x:\s*var\(--homepage-pad-x/);
    expect(css).not.toMatch(/--cds-space-page-x:\s*var\(--homepage-pad-x/);
    expect(css).not.toMatch(/--fw-pad-x:\s*var\(--homepage-pad-x/);
    expect(css).not.toMatch(/--homepage-pad-x:\s*var\(--fw-pad-x/);
    expect(css).not.toMatch(/--homepage-pad-x:\s*var\(--rx-phone-inset-x/);
    expect(css).not.toMatch(/--homepage-pad-x:\s*var\(--internal-pad-x/);
  });

  it("Homepage pads with Homepage tokens; Internal phone-width stays Internal", () => {
    const homepageHeader = readSource("styles/rovexo/homepage-header.css");
    expect(homepageHeader).toContain("var(--homepage-pad-x");
    expect(homepageHeader).not.toContain("--rx-phone-inset-x");

    const phone = readSource("styles/rovexo/phone-width-v1-freeze.css");
    expect(phone).toContain("--rx-phone-inset-x: 16px");
    expect(phone).not.toMatch(/--rx-phone-inset-x:\s*var\(--homepage-pad-x/);
  });
});
