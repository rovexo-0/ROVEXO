import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import {
  NOTIFICATION_ROUTES,
  resolveCompletionGapHref,
  resolveNotificationTypeHref,
  resolveSmartNotificationHref,
} from "@/lib/notifications/routing";
import { ROVEXO_ACCOUNT_KIND, resolveAccountCapabilities } from "@/lib/profile/unified-account";
import type { UserProfile } from "@/lib/profile/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const baseProfile: UserProfile = {
  id: "user-1",
  fullName: "Mihai Palade",
  username: "mihai",
  email: "mihai@example.com",
  verified: true,
  memberSince: "2026-01-01",
  role: "buyer",
  accountKind: ROVEXO_ACCOUNT_KIND,
  accountType: ROVEXO_ACCOUNT_KIND,
  capabilities: resolveAccountCapabilities({
    role: "buyer",
    verified: true,
    hasSellerProfile: false,
    hasBusinessAccount: false,
  }),
  isSeller: false,
  isAdmin: false,
  isSuperAdmin: false,
  unreadMessages: 0,
  unreadNotifications: 0,
};

describe("Module 02B — Settings + Wallet + Smart Notifications SSOT", () => {
  it("keeps Settings on the hub menu; Promote lives on Profile (Master Engine)", () => {
    const sections = buildAccountMenuSections(baseProfile, { activeListingCount: 1 });
    const titles = sections.flatMap((section) => section.items.map((item) => item.title));
    expect(titles).toContain("Settings");
    expect(titles).toContain("Promote");
    expect(titles).not.toContain("Contact Support");
    expect(readSource("lib/account-center/canonical-menu.ts")).not.toContain("Contact Support");
    expect(readSource("lib/account-center/settings-menu.ts")).not.toContain("Promotion Tools");
  });

  it("locks Settings hub sections for Master Engine", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    const menu = readSource("lib/account-center/settings-menu.ts");
    const sections = readSource("features/account-module/components/SettingsMenuSections.tsx");

    expect(settings).toContain("MyAccountTemplate");
    expect(settings).toContain("SettingsMenuSections");
    expect(menu).toContain('"Personal Information"');
    expect(menu).toContain('"Addresses"');
    expect(menu).toContain('"Notifications"');
    expect(menu).toContain('"Privacy"');
    expect(menu).toContain('"Security"');
    expect(menu).not.toContain('title: "Verification"');
    expect(menu).not.toContain('title: "Payment Methods"');
    expect(menu).toContain('title: "HMRC Reporting"');
    expect(menu).not.toContain('title: "Accessibility"');
    expect(menu).toContain('"LEGAL"');
    expect(menu).toContain("Help Centre");
    expect(settings).not.toContain("🗑 Account");
    expect(settings).not.toContain("Identity Verification");
    expect(sections).toContain("DeleteAccountFlow");
    expect(sections).toContain("dangerRow");
    expect(sections).not.toContain("CanonicalCard");
    expect(sections).toContain("fw-engine__group");
    expect(sections).toContain("CanonicalMenuRow");
  });

  it("locks Personal Wallet Compact Premium hub and withdraw flow", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const withdraw = readSource("features/wallet/components/withdraw/WithdrawPage.tsx");
    const withdrawApi = readSource("app/api/wallet/withdraw/route.ts");

    expect(hub).toContain('data-wallet-hub-version="v1.0-canonical"');
    expect(hub).toContain("wallet-v2__hero");
    expect(hub).toContain("Available Balance");
    expect(hub).toContain("Withdraw");
    expect(hub).toContain("BALANCE_PAGE_NAME");
    expect(hub).not.toContain('title="Wallet"');
    expect(hub).not.toContain("Platform Fee");
    expect(withdraw).toContain("WITHDRAW_PAGE_VERSION");
    expect(withdraw).toContain("data-withdraw-ui");
    expect(withdraw).toContain("WALLET_ROUTES");
    expect(withdrawApi).toContain("recordWithdrawal");
    expect(withdrawApi).toContain("emitSmartNotification");
    expect(withdrawApi).toContain("NOTIFICATION_ROUTES");
  });

  it("locks monthly statements with chained balances and PDF export", () => {
    const engine = readSource("lib/wallet/monthly-statements.ts");
    const detail = readSource("features/wallet/components/MonthlyStatementDetail.tsx");

    expect(engine).toContain("startBalance");
    expect(engine).toContain("endBalance");
    expect(engine).toContain("runningBalance");
    expect(detail).toContain("Opening Balance");
    expect(detail).toContain("Closing Balance");
    expect(detail).toContain("Download PDF");
    expect(detail).toContain("Download CSV");
    expect(detail).toContain("window.print");
  });

  it("routes smart notifications to canonical destinations", () => {
    expect(resolveSmartNotificationHref("new_message", { conversationId: "c1" })).toBe(
      "/inbox/conversation/c1",
    );
    expect(resolveSmartNotificationHref("new_offer", { offerId: "o1" })).toBe(
      "/inbox?tab=messages&filter=offers&offer=o1",
    );
    expect(resolveSmartNotificationHref("new_order", { orderId: "ord1" })).toBe(
      "/inbox?order=ord1",
    );
    expect(resolveSmartNotificationHref("order_shipped", { orderId: "ord1" })).toBe(
      "/inbox?order=ord1&focus=tracking",
    );
    expect(resolveSmartNotificationHref("listing_sold", { productId: "p1" })).toBe("/inbox");
    expect(resolveSmartNotificationHref("listing_sold", { orderId: "ord1" })).toBe(
      "/inbox?order=ord1",
    );
    expect(resolveSmartNotificationHref("payment_received", { transactionId: "t1" })).toBe(
      "/wallet/transactions/t1",
    );
    expect(resolveSmartNotificationHref("payment_received", { orderId: "ord1" })).toBe(
      "/inbox?order=ord1",
    );
    expect(resolveSmartNotificationHref("trust_verification")).toBe("/account/security");

    expect(resolveNotificationTypeHref("review")).toBe(NOTIFICATION_ROUTES.reviews);
    expect(resolveNotificationTypeHref("payment", { transactionId: "t2" })).toBe(
      "/wallet/transactions/t2",
    );
    expect(resolveNotificationTypeHref("payment", { orderId: "ord1" })).toBe("/inbox?order=ord1");
    expect(resolveNotificationTypeHref("payment")).toBe("/inbox");

    expect(resolveCompletionGapHref("bank", "/wallet/withdraw")).toContain(
      "/wallet/bank-accounts",
    );
    expect(resolveCompletionGapHref("address", "/checkout/item")).toContain("/account/addresses");
    expect(resolveCompletionGapHref("payment", "/checkout/item")).toContain("/wallet/payment-methods");
  });

  it("embeds help centre category buttons inside help", () => {
    const help = readSource("features/help/components/HelpCentreCanonicalSection.tsx");
    const page = readSource("features/help/components/HelpCentrePage.tsx");
    const categories = readSource("lib/help/help-centre-categories.ts");

    expect(help).toContain('data-help-centre-version="v1.0-legal-lock"');
    expect(categories).toContain('"Buying"');
    expect(categories).toContain('"Reports & Appeals"');
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain("HelpCentreCategoryGrid");
    expect(page).not.toContain("MobileBrowseTopics");
  });

  it("exposes Module 02B notification preference labels", () => {
    const prefs = readSource("features/notifications/components/NotificationSettingsPage.tsx");
    const controls = readSource("lib/notifications/controls.ts");
    const engine = readSource("lib/notifications/notification-engine-v1.ts");

    expect(prefs).toContain("NOTIFICATION_ENGINE_SECTIONS");
    expect(engine).toContain("Push Notifications");
    expect(engine).toContain("Email Notifications");
    expect(engine).toContain('label: "Orders"');
    expect(engine).toContain('label: "New Reviews"');
    expect(controls).toContain("NOTIFICATION_USER_CONTROLS");
    expect(controls).toContain('label: "Inbox"');
    expect(controls).not.toContain('label: "Followers"');
  });
});
