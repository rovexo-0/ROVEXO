/**
 * ROVEXO MASTER ENGINE v1.0 (LOCK) — tests.
 */

import { describe, expect, it, afterEach } from "vitest";
import {
  MASTER_ENGINE_NAME,
  MASTER_ENGINE_PRODUCTION_READY,
  MASTER_ENGINE_VERSION,
  activateProductionRules,
  areProductionRulesActive,
  deactivateProductionRules,
  getMasterEngineSnapshot,
  resolveSmartVisibility,
  applyProductionVisibilityRules,
  resolveFeatureVisibility,
  resolveVerifiedStatus,
  resolveBusinessVisibility,
  resolveHolidayModeVisibility,
  resolvePromoteVisibility,
} from "@/lib/master-engine";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import { ACCOUNT_MENU_TITLES } from "@/lib/account/freeze";
import { buildSettingsMenuSections } from "@/lib/account-center/settings-menu";
import { SETTINGS_MENU_ROW_TITLES, SETTINGS_SECTION_TITLES } from "@/lib/settings/freeze";
import { buildPersonalWalletMenuSections } from "@/lib/account-center/wallet-menus";

const baseProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  fullName: "Test",
  username: "test",
  email: "test@rovexo.test",
  verified: false,
  memberSince: "2026",
  role: "buyer",
  accountKind: "account",
  accountType: "personal",
  capabilities: {},
  isSeller: false,
  isAdmin: false,
  isSuperAdmin: false,
  unreadMessages: 0,
  unreadNotifications: 0,
} as never;

describe("ROVEXO MASTER ENGINE v1.0 (LOCK)", () => {
  afterEach(() => {
    deactivateProductionRules();
  });

  it("is production-ready with a single inactive activation switch", () => {
    expect(MASTER_ENGINE_NAME).toBe("ROVEXO MASTER ENGINE");
    expect(MASTER_ENGINE_VERSION).toBe("v1.0");
    expect(MASTER_ENGINE_PRODUCTION_READY).toBe(true);
    expect(areProductionRulesActive()).toBe(false);
    expect(getMasterEngineSnapshot().activationApi).toBe("activateProductionRules()");
  });

  it("shows everything before activateProductionRules()", () => {
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
    expect(resolveHolidayModeVisibility({ activeListingCount: 0 }).visible).toBe(true);
    expect(resolvePromoteVisibility({ activeListingCount: 0 }).visible).toBe(true);
    expect(resolveBusinessVisibility({ isBusinessVerified: false }).showBusinessBank).toBe(true);
    expect(resolveVerifiedStatus({ isRovexoVerified: false }).showBadge).toBe(false);
    expect(resolveVerifiedStatus({ isRovexoVerified: true }).showBadge).toBe(true);
  });

  it("activates production rules only via activateProductionRules()", () => {
    activateProductionRules();
    expect(areProductionRulesActive()).toBe(true);
    expect(
      resolveSmartVisibility({ activeListingCount: 0, isBusinessVerified: false }),
    ).toMatchObject({
      showHolidayMode: false,
      showPromoteListings: false,
      showBusinessBankAccount: false,
      showPaymentMethods: true,
      showPersonalBankAccount: true,
      showWithdraw: true,
    });
    expect(resolveFeatureVisibility("holiday-mode", { activeListingCount: 0 }).visible).toBe(false);
    expect(resolveFeatureVisibility("holiday-mode", { activeListingCount: 2 }).visible).toBe(true);
    expect(resolveBusinessVisibility({ isBusinessVerified: false }).showBusinessBank).toBe(false);
    expect(resolveBusinessVisibility({ isBusinessVerified: true }).showBusinessBank).toBe(true);
    expect(resolveVerifiedStatus({ isRovexoVerified: false }).showBadge).toBe(false);
    expect(resolveVerifiedStatus({ isRovexoVerified: true }).showBadge).toBe(true);
    deactivateProductionRules();
    expect(areProductionRulesActive()).toBe(false);
  });

  it("keeps production rule implementations without default activation", () => {
    expect(
      applyProductionVisibilityRules({
        activeListingCount: 2,
        isBusinessVerified: true,
        isRovexoVerified: true,
        availableBalance: 10,
      }),
    ).toMatchObject({
      showHolidayMode: true,
      showPromoteListings: true,
      showBusinessBankAccount: true,
      showPaymentMethods: true,
      showPersonalBankAccount: true,
      disableWithdrawForZeroBalance: false,
    });
  });

  it("locks Profile menu inventory including Promote", () => {
    const titles = buildAccountMenuSections(baseProfile, { activeListingCount: 1 }).flatMap((s) =>
      s.items.map((i) => i.title),
    );
    expect(titles).toEqual([...ACCOUNT_MENU_TITLES]);
  });

  it("locks Settings inventory without Promote / Payments / Banks / Sign Out", () => {
    const sections = buildSettingsMenuSections(null);
    expect(sections.map((s) => s.title)).toEqual([...SETTINGS_SECTION_TITLES]);
    expect(sections.flatMap((s) => s.rows.map((r) => r.title))).toEqual([...SETTINGS_MENU_ROW_TITLES]);
  });

  it("shows Payment Methods + Bank Accounts hub while inactive", () => {
    expect(
      buildPersonalWalletMenuSections({ isBusinessVerified: false })
        .flatMap((s) => s.items)
        .map((i) => i.title),
    ).toEqual(["Transactions", "Payment Methods", "Bank Accounts"]);
  });

  it("golden rule: production menu gates use Master Engine feature resolvers", () => {
    activateProductionRules();
    const zero = buildAccountMenuSections(baseProfile, { activeListingCount: 0 })
      .flatMap((s) => s.items)
      .map((i) => i.title);
    expect(zero).not.toContain("Holiday Mode");
    expect(zero).not.toContain("Promote");

    const withListings = buildAccountMenuSections(baseProfile, { activeListingCount: 3 })
      .flatMap((s) => s.items)
      .map((i) => i.title);
    expect(withListings).toContain("Holiday Mode");
    expect(withListings).toContain("Promote");

    const walletHidden = buildPersonalWalletMenuSections({ isBusinessVerified: false })
      .flatMap((s) => s.items)
      .map((i) => i.title);
    expect(walletHidden).toEqual(["Transactions", "Payment Methods", "Bank Accounts"]);

    const walletShown = buildPersonalWalletMenuSections({ isBusinessVerified: true })
      .flatMap((s) => s.items)
      .map((i) => i.title);
    expect(walletShown).toContain("Bank Accounts");
  });
});
