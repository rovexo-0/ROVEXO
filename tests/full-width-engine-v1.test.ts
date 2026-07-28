/**
 * ROVEXO FULL WIDTH ENGINE v1.0 (LOCKED)
 *
 * ONE PLATFORM = ONE DESIGN SYSTEM.
 * Profile page is the official visual reference (My Account v1.0).
 *
 * Forbidden: borders · decorative cards · shadows · boxes · custom widths · custom spacing.
 * Required: 100% width · Internal L/R 16px (Design Decision #001) · flat rows · Switch Engine · chevron >
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FULL_WIDTH_ENGINE_SPEC,
  FULL_WIDTH_ENGINE_STATUS,
  FULL_WIDTH_ENGINE_VERSION,
  FULL_WIDTH_REFERENCE_PAGE,
  getFullWidthEngineSnapshot,
} from "@/lib/master-engine/full-width-engine";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Full Width Engine v1.0 (LOCKED)", () => {
  it("locks Profile as reference and Owner spacing", () => {
    const snap = getFullWidthEngineSnapshot();
    expect(FULL_WIDTH_ENGINE_STATUS).toBe("LOCKED");
    expect(FULL_WIDTH_ENGINE_VERSION).toBe("v1.0");
    expect(FULL_WIDTH_REFERENCE_PAGE).toBe("profile");
    expect(snap.spec).toEqual(FULL_WIDTH_ENGINE_SPEC);
    expect(FULL_WIDTH_ENGINE_SPEC.width).toBe("100%");
    expect(FULL_WIDTH_ENGINE_SPEC.paddingLeftPx).toBe(16);
    expect(FULL_WIDTH_ENGINE_SPEC.paddingRightPx).toBe(16);
    expect(FULL_WIDTH_ENGINE_SPEC.paddingTopPx).toBe(24);
    expect(FULL_WIDTH_ENGINE_SPEC.paddingBottomPx).toBe(24);
    expect(FULL_WIDTH_ENGINE_SPEC.headerPx).toBe(64);
    expect(FULL_WIDTH_ENGINE_SPEC.sectionSpacingPx).toBe(24);
    expect(FULL_WIDTH_ENGINE_SPEC.forbidden).toContain("decorative-cards");
    expect(FULL_WIDTH_ENGINE_SPEC.forbidden).toContain("borders");
    expect(FULL_WIDTH_ENGINE_SPEC.forbidden).toContain("shadows");
    expect(FULL_WIDTH_ENGINE_SPEC.forbidden).toContain("90%");
  });

  it("ships CSS tokens and card/border/shadow removal", () => {
    const css = readSource("styles/rovexo/full-width-engine-v1.css");
    expect(css).toContain("--fw-pad-x: 16px");
    expect(css).toContain("--homepage-pad-x: 24px");
    expect(css).toContain("--fw-pad-y: 24px");
    expect(css).toContain("--fw-header-height: 64px");
    expect(css).toContain("--fw-width: 100%");
    expect(css).toContain("--fw-max-width: none");
    expect(css).toContain('[data-full-width-engine="v1.0"]');
    expect(css).toContain("border: none !important");
    expect(css).toContain("box-shadow: none !important");
    expect(css).toContain("border-radius: 0 !important");
    expect(css).not.toMatch(/max-width:\s*(320|360|390|420)px/);
    expect(readSource("styles/rovexo/index.css")).toContain("full-width-engine-v1.css");
  });

  it("applies engine on AccountCanonicalShell and flat Settings/Wallet hubs", () => {
    expect(readSource("features/account-canonical/shell/AccountCanonicalShell.tsx")).toContain(
      'data-full-width-engine="v1.0"',
    );
    expect(readSource("features/account-module/components/SettingsMenuSections.tsx")).not.toContain(
      "CanonicalCard",
    );
    expect(readSource("features/wallet/components/WalletHubV1.tsx")).not.toContain("CanonicalCard");
    expect(readSource("features/wallet/components/WalletMenuSections.tsx")).not.toContain(
      "CanonicalCard",
    );
  });
});
