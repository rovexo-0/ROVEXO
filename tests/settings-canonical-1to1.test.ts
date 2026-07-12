import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const SETTINGS_SHELL_PAGES = [
  "features/account-module/components/SettingsV1.tsx",
  "features/account-module/components/PromotionToolsV1.tsx",
  "features/account/components/AddressBookPage.tsx",
  "features/account/components/PaymentMethodsPage.tsx",
  "features/account/components/AccountPrivacyPage.tsx",
  "features/account/components/AccountSecurityPage.tsx",
  "features/account/components/AccountBlockedUsersPage.tsx",
  "features/account/components/ProfileEditPage.tsx",
  "features/account/components/AccountLanguagePage.tsx",
  "features/account/components/AccountCurrencyPage.tsx",
  "features/account/components/AccountTimezonePage.tsx",
  "features/account/components/AccountAppearancePage.tsx",
  "features/account/components/AccountBuyerPreferencesPage.tsx",
];

const SETTINGS_MENU_PAGES = [
  ...SETTINGS_SHELL_PAGES,
  "features/account-module/components/SettingsAboutV1.tsx",
];

const ACCOUNT_MODULE_SHELL_PAGES = [
  "features/account-module/components/OrdersV1.tsx",
  "features/account-module/components/SellerListingsV1.tsx",
  "features/account-module/components/SavedItemsV1.tsx",
  "features/account-module/components/ReviewsV1.tsx",
  "features/account-module/components/RovexoIdeasPage.tsx",
  "features/account-center/components/AccountCenterModulePage.tsx",
];

describe("settings + account canonical experience", () => {
  it("routes settings menu primitives through canonical design system", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    const accordion = readSource("features/account-module/components/SettingsAccordion.tsx");
    expect(settings).toContain("AccountCanonicalShell");
    expect(accordion).toContain("CanonicalMenuRow");
    expect(accordion).toContain("CanonicalCard");
    expect(settings).not.toContain("CanonicalAccountMenuRow");
  });

  it("routes settings and account shells through AccountCanonicalHeader", () => {
    const shell = readSource("features/account-canonical/shell/AccountCanonicalShell.tsx");
    expect(shell).toContain("AccountCanonicalHeader");
    expect(shell).toContain('data-account-canonical="v2.0"');
    expect(shell).not.toContain("ScrollContainer");
    expect(shell).not.toContain("AccountModuleBackHeader");
  });

  it.each(SETTINGS_SHELL_PAGES)("%s uses shared canonical shell", (relativePath) => {
    const source = readSource(relativePath);
    expect(source).toMatch(/AccountCanonicalShell|AccountCanonicalShell/);
    expect(source).not.toContain("rx-surface-card");
    expect(source).not.toContain("acm-settings__row");
  });

  it.each(SETTINGS_MENU_PAGES)("%s uses canonical menu primitives", (relativePath) => {
    const source = readSource(relativePath);
    expect(source).not.toContain("acm-settings__row");
    expect(source).not.toContain("CanonicalAccountMenuRow");
  });

  it.each(ACCOUNT_MODULE_SHELL_PAGES)("%s uses AccountCanonicalShell", (relativePath) => {
    const source = readSource(relativePath);
    expect(source).toContain("AccountCanonicalShell");
  });

  it("AccountCanonicalShell uses canonical intro token", () => {
    const shell = readSource("features/account-canonical/shell/AccountCanonicalShell.tsx");
    expect(shell).toContain("cds-section__intro");
  });

  it("AccountCanonicalHeader is back-only with /account fallback", () => {
    const header = readSource("features/account-canonical/header/AccountCanonicalHeader.tsx");
    expect(header).toContain('data-account-canonical-header="v1"');
    expect(header).not.toContain("cds-header__title");
    expect(header).toContain('ACCOUNT_BACK_FALLBACK = "/account"');
    expect(header).toContain("preferHistory: true");
    expect(header).toContain("usePageBack");
  });

  it("delete account flow uses CanonicalModal", () => {
    const flow = readSource("features/account-module/components/DeleteAccountFlow.tsx");
    expect(flow).toContain("CanonicalModal");
    expect(flow).not.toContain("ConfirmDialog");
  });
});

describe("CanonicalAccount legacy wrappers", () => {
  it("does not modify locked My Account hub", () => {
    const hub = readSource("features/account-center/components/AccountCenterHome.tsx");
    expect(hub).not.toContain("CanonicalPageLayout");
    expect(hub).toContain("AccountMenuSections");
  });
});
