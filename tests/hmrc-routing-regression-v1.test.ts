/**
 * COD SÂNGE — HMRC Reporting routing regression P0
 * Settings → HMRC Reporting must open /seller/compliance for authenticated users.
 * Must NOT bounce authorized users back to Settings.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  canAccessHmrcSellerCentre,
  resolveHmrcEligibility,
} from "@/lib/compliance/hmrc-eligibility-v1";
import { PHASE_C3_SETTINGS_IA_V1 } from "@/lib/settings/phase-c3-settings-information-architecture-v1";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("HMRC Reporting routing regression P0", () => {
  it("keeps canonical HMRC route /seller/compliance (no second page)", () => {
    expect(PHASE_C3_SETTINGS_IA_V1.routes.hmrc).toBe("/seller/compliance");
    const menu = readSource("lib/account-center/settings-menu.ts");
    expect(menu).toContain('title: "HMRC Reporting"');
    expect(menu).toContain("R.hmrc");
    const page = readSource("app/(platform)/seller/compliance/page.tsx");
    expect(page).toContain("ComplianceDashboard");
    // Must not treat HMRC as a Settings page redirect destination for authorized users
    expect(page).not.toMatch(/redirect\(\s*["']\/account\/settings["']\s*\)/);
    expect(PHASE_C3_SETTINGS_IA_V1.routes.hmrc).toBe("/seller/compliance");
  });

  it("authorized Unified Account (buyer role, no selling activity) must NOT be denied the centre", () => {
    const access = resolveHmrcEligibility({
      authenticated: true,
      hasSellingActivity: false,
      role: "buyer",
      completedSales: 0,
      grossSales: 0,
    });
    expect(canAccessHmrcSellerCentre(access)).toBe(true);
    expect(access.canViewCentre).toBe(true);
    // Obligations remain fail-closed for pure buyers
    expect(access.isReportingSubject).toBe(false);
    expect(access.buyerExcludedFromObligation).toBe(true);
  });

  it("authorized seller / selling activity still opens the centre", () => {
    const sellerRole = resolveHmrcEligibility({
      authenticated: true,
      hasSellingActivity: false,
      role: "seller",
    });
    expect(canAccessHmrcSellerCentre(sellerRole)).toBe(true);
    expect(sellerRole.isReportingSubject).toBe(true);

    const withActivity = resolveHmrcEligibility({
      authenticated: true,
      hasSellingActivity: true,
      role: "buyer",
    });
    expect(canAccessHmrcSellerCentre(withActivity)).toBe(true);
    expect(withActivity.isReportingSubject).toBe(true);
  });

  it("unauthorized (unauthenticated) remains fail-closed", () => {
    const guest = resolveHmrcEligibility({
      authenticated: false,
      hasSellingActivity: false,
      role: null,
    });
    expect(canAccessHmrcSellerCentre(guest)).toBe(false);
    expect(guest.canViewCentre).toBe(false);
  });

  it("compliance page redirects unauthenticated to login, not Settings first", () => {
    const page = readSource("app/(platform)/seller/compliance/page.tsx");
    const loginIdx = page.indexOf('redirect("/login?next=/seller/compliance")');
    const settingsIdx = page.indexOf('redirect("/account/settings?hmrc=seller_only")');
    expect(loginIdx).toBeGreaterThan(-1);
    expect(settingsIdx).toBeGreaterThan(loginIdx);
    // Guard must use canAccessHmrcSellerCentre (eligibility SSOT) — not a broken pathname matcher
    expect(page).toContain("canAccessHmrcSellerCentre");
    expect(page).toContain("resolveHmrcEligibility");
    expect(page).not.toContain("router.push");
    expect(page).not.toContain("router.replace");
  });

  it("Settings hub route remains /account/settings; HMRC is not a Settings sub-page", () => {
    expect(PHASE_C3_SETTINGS_IA_V1.hubRoute).toBe("/account/settings");
    expect(PHASE_C3_SETTINGS_IA_V1.routes.hmrc).not.toContain("/account/settings");
    const settingsPage = readSource("app/(platform)/account/settings/page.tsx");
    expect(settingsPage).not.toContain("ComplianceDashboard");
    expect(settingsPage).not.toContain("hmrc-eligibility");
  });
});
