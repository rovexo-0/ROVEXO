/**
 * ROVEXO Smart Visibility Engine v1.0 + Verified Engine activation tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateDataMatch } from "@/lib/verified/data-match";
import { resolveSmartVisibility as resolveVerifiedBridge } from "@/lib/verified/visibility";
import { canShowRovexoVerifiedBadge } from "@/lib/verified/index";
import {
  ROVEXO_VERIFIED_BADGE_NAME,
  ROVEXO_VERIFIED_BADGE_SIZE_PX,
  ROVEXO_VERIFIED_ENGINE_ACTIVE,
  ROVEXO_VERIFIED_ENGINE_PRODUCTION_READY,
  ROVEXO_VERIFIED_ENGINE_VERSION,
} from "@/lib/verified/constants";
import {
  SMART_VISIBILITY_ENGINE_ACTIVE,
  SMART_VISIBILITY_ENGINE_VERSION,
  SMART_VISIBILITY_PRODUCTION_READY,
  applyProductionVisibilityRules,
  isSmartVisibilityEngineActive,
  resolveSmartVisibility,
} from "@/lib/smart-visibility";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Verified Engine v1.0", () => {
  it("locks single badge name and size", () => {
    expect(ROVEXO_VERIFIED_BADGE_NAME).toBe("ROVEXO VERIFIED");
    expect(ROVEXO_VERIFIED_BADGE_SIZE_PX).toBe(7);
    expect(ROVEXO_VERIFIED_ENGINE_VERSION).toBe("v1.0");
    expect(ROVEXO_VERIFIED_ENGINE_PRODUCTION_READY).toBe(true);
    expect(ROVEXO_VERIFIED_ENGINE_ACTIVE).toBe(false);
    expect(readSource("components/VerifiedBadge.tsx")).toContain('data-verified-badge="rovexo-v1"');
  });

  it("fails data match closed on missing fields", () => {
    const result = evaluateDataMatch({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "",
      accountHolderName: "Ada Lovelace",
    });
    expect(result.pass).toBe(false);
    expect(result.failedSteps).toContain("phone_number");
  });

  it("fails data match closed on name mismatch", () => {
    const result = evaluateDataMatch({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+447700900123",
      accountHolderName: "Someone Else",
    });
    expect(result.pass).toBe(false);
    expect(result.failedSteps).toContain("bank_account_name_mismatch");
  });

  it("passes data match when personal details align", () => {
    const result = evaluateDataMatch({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+447700900123",
      accountHolderName: "Lovelace Ada",
    });
    expect(result.pass).toBe(true);
  });

  it("forbids badge on sensitive surfaces", () => {
    expect(canShowRovexoVerifiedBadge("checkout")).toBe(false);
    expect(canShowRovexoVerifiedBadge("payment")).toBe(false);
    expect(canShowRovexoVerifiedBadge("settings")).toBe(false);
    expect(canShowRovexoVerifiedBadge("profile")).toBe(true);
  });

  it("wires money gate into withdraw path (inactive until production)", () => {
    expect(readSource("lib/wallet/store.ts")).toContain("assertRovexoVerifiedForMoney");
    expect(readSource("lib/verified/money-gate.ts")).toContain("assertSmartMoneyMovement");
    expect(readSource("lib/profile/auto-verified.ts")).toContain("recalculateRovexoVerified");
  });
});

describe("ROVEXO Smart Visibility Engine v1.0", () => {
  it("is production-ready but inactive", () => {
    expect(SMART_VISIBILITY_ENGINE_VERSION).toBe("v1.0");
    expect(SMART_VISIBILITY_PRODUCTION_READY).toBe(true);
    expect(SMART_VISIBILITY_ENGINE_ACTIVE).toBe(false);
    expect(isSmartVisibilityEngineActive()).toBe(false);
  });

  it("shows everything while inactive (local / QA / certification)", () => {
    expect(
      resolveSmartVisibility({ activeListingCount: 0, isBusinessVerified: false }),
    ).toEqual({
      showHolidayMode: true,
      showPromoteListings: true,
      showBusinessBankAccount: true,
      showPaymentMethods: true,
      showPersonalBankAccount: true,
      showWithdraw: true,
      allowVerifiedBadge: true,
      showTransactionsEmptyState: true,
      disableWithdrawForZeroBalance: false,
    });
    expect(
      resolveVerifiedBridge({ activeListingCount: 0, isBusinessVerified: false }),
    ).toMatchObject({
      showHolidayMode: true,
      showPromoteListings: true,
      showBusinessBankAccount: true,
      showPaymentMethods: true,
      showPersonalBankAccount: true,
      showWithdraw: true,
    });
  });

  it("implements production rules without activating them", () => {
    expect(
      applyProductionVisibilityRules({ activeListingCount: 0, isBusinessVerified: false }),
    ).toEqual({
      showHolidayMode: false,
      showPromoteListings: false,
      showBusinessBankAccount: false,
      showPaymentMethods: true,
      showPersonalBankAccount: true,
      showWithdraw: true,
      allowVerifiedBadge: false,
      showTransactionsEmptyState: true,
      disableWithdrawForZeroBalance: false,
    });
    expect(
      applyProductionVisibilityRules({
        activeListingCount: 2,
        isBusinessVerified: true,
        hasPaymentMethod: false,
        isRovexoVerified: true,
        availableBalance: 10,
      }),
    ).toEqual({
      showHolidayMode: true,
      showPromoteListings: true,
      showBusinessBankAccount: false,
      showPaymentMethods: true,
      showPersonalBankAccount: true,
      showWithdraw: true,
      allowVerifiedBadge: true,
      showTransactionsEmptyState: true,
      disableWithdrawForZeroBalance: false,
    });
  });
});
