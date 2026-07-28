/**
 * ROVEXO Global Smart Platform Engine v1.0 — tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SMART_PLATFORM_ENGINE_ACTIVE,
  SMART_PLATFORM_ENGINE_NAME,
  SMART_PLATFORM_ENGINE_VERSION,
  SMART_PLATFORM_PRODUCTION_READY,
  SMART_PLATFORM_SUB_ENGINES,
  getSmartPlatformEngineSnapshot,
  isSmartPlatformProductionActive,
  isSmartPlatformShowEverythingMode,
  listSmartFeatures,
  resolveFeatureVisibility,
  resolveSmartPlatformMode,
  resolveSmartVisibility,
  applyProductionVisibilityRules,
} from "@/lib/smart-platform";
import {
  ROVEXO_VERIFIED_ENGINE_ACTIVE,
  ROVEXO_VERIFIED_ENGINE_PRODUCTION_READY,
} from "@/lib/verified/constants";
import {
  SMART_VISIBILITY_ENGINE_ACTIVE,
  SMART_VISIBILITY_PRODUCTION_READY,
} from "@/lib/smart-visibility/engine";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Global Smart Platform Engine v1.0", () => {
  it("is production-ready and inactive", () => {
    expect(SMART_PLATFORM_ENGINE_NAME).toBe("ROVEXO GLOBAL SMART PLATFORM ENGINE");
    expect(SMART_PLATFORM_ENGINE_VERSION).toBe("v1.0");
    expect(SMART_PLATFORM_PRODUCTION_READY).toBe(true);
    expect(SMART_PLATFORM_ENGINE_ACTIVE).toBe(false);
    expect(isSmartPlatformProductionActive()).toBe(false);
    expect(isSmartPlatformShowEverythingMode()).toBe(true);
    expect(resolveSmartPlatformMode()).not.toBe("production");
  });

  it("registers all sub-engines as ready and inactive", () => {
    const snapshot = getSmartPlatformEngineSnapshot();
    expect(snapshot.engines).toHaveLength(SMART_PLATFORM_SUB_ENGINES.length);
    expect(snapshot.engines.every((engine) => engine.productionReady && !engine.active)).toBe(true);
    expect(SMART_VISIBILITY_PRODUCTION_READY).toBe(true);
    expect(SMART_VISIBILITY_ENGINE_ACTIVE).toBe(false);
    expect(ROVEXO_VERIFIED_ENGINE_PRODUCTION_READY).toBe(true);
    expect(ROVEXO_VERIFIED_ENGINE_ACTIVE).toBe(false);
  });

  it("shows everything while inactive", () => {
    expect(
      resolveSmartVisibility({ activeListingCount: 0, isBusinessVerified: false }),
    ).toMatchObject({
      showHolidayMode: true,
      showPromoteListings: true,
      showBusinessBankAccount: true,
      showPaymentMethods: true,
      showPersonalBankAccount: true,
      showWithdraw: true,
    });
    expect(resolveFeatureVisibility("holiday-mode", { activeListingCount: 0 }).visible).toBe(true);
    expect(resolveFeatureVisibility("business-bank-account", { isBusinessVerified: false }).visible).toBe(
      true,
    );
  });

  it("implements production rules without activating them", () => {
    expect(
      applyProductionVisibilityRules({ activeListingCount: 0, isBusinessVerified: false }),
    ).toMatchObject({
      showHolidayMode: false,
      showPromoteListings: false,
      showBusinessBankAccount: false,
      showPaymentMethods: true,
      showPersonalBankAccount: true,
    });
    expect(listSmartFeatures().map((feature) => feature.id)).toEqual(
      expect.arrayContaining([
        "holiday-mode",
        "promote-listings",
        "verified-badge",
        "withdraw",
        "business-bank-account",
        "payment-methods",
        "personal-bank-account",
      ]),
    );
  });

  it("wires money gate through platform Smart Money Engine", () => {
    expect(readSource("lib/verified/money-gate.ts")).toContain("assertSmartMoneyMovement");
    expect(readSource("lib/smart-platform/money.ts")).toContain("isSmartPlatformProductionActive");
    expect(readSource("lib/wallet/store.ts")).toContain("assertRovexoVerifiedForMoney");
  });
});
