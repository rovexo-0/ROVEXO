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
  it("keeps ACCOUNT to Settings only and SUPPORT without Contact Support", () => {
    const sections = buildAccountMenuSections(baseProfile);
    const account = sections.find((section) => section.id === "account");
    const support = sections.find((section) => section.id === "support");

    expect(account?.items.map((item) => item.title)).toEqual(["Settings", "Promotion Tools"]);
    expect(support?.items.map((item) => item.title)).toEqual(["Help Centre", "Ideas"]);
    expect(support?.items[0]?.href).toBe("/help");
    expect(readSource("lib/account-center/canonical-menu.ts")).not.toContain("Contact Support");
  });

  it("locks Settings hub sections for Module 02B", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    const menu = readSource("lib/account-center/settings-menu.ts");
    const sections = readSource("features/account-module/components/SettingsMenuSections.tsx");

    expect(settings).toContain("AccountCanonicalShell");
    expect(settings).toContain("SettingsMenuSections");
    expect(menu).toContain('"Profile"');
    expect(menu).toContain('"Addresses"');
    expect(menu).toContain('"Payment Methods"');
    expect(menu).toContain('"Notifications"');
    expect(menu).toContain('"Privacy & Security"');
    expect(menu).toContain('"Seller Performance"');
    expect(menu).toContain('"LEGAL"');
    expect(settings).not.toContain("🗑 Account");
    expect(settings).not.toContain("Identity Verification");
    expect(sections).toContain("DeleteAccountFlow");
    expect(sections).toContain("dangerRow");
    expect(sections).toContain("CanonicalCard");
    expect(sections).toContain("CanonicalMenuRow");
  });

  it("locks wallet financial hub and withdraw flow", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const withdraw = readSource("features/wallet/components/withdraw/WithdrawPage.tsx");
    const withdrawApi = readSource("app/api/wallet/withdraw/route.ts");

    expect(hub).toContain('data-wallet-hub-version="v1.0-production"');
    expect(hub).toContain('data-wallet-ui="v1.0-final"');
    expect(hub).toContain("Available Balance");
    expect(hub).toContain("WALLET_ROUTES.withdraw");
    expect(hub).toContain("WALLET_ROUTES.transactions");
    expect(hub).toContain("WALLET_ROUTES.paymentMethods");
    expect(hub).not.toContain("Platform Fee");
    expect(withdraw).toContain('data-wallet-withdraw-version="v2.0-02b"');
    expect(withdraw).toContain("WALLET_ROUTES.bankAccount");
    expect(withdraw).toContain("Withdraw to Bank Account");
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
    expect(resolveSmartNotificationHref("new_offer", { offerId: "o1" })).toBe("/offers/o1");
    expect(resolveSmartNotificationHref("new_order", { orderId: "ord1" })).toBe("/orders/ord1");
    expect(resolveSmartNotificationHref("order_shipped", { orderId: "ord1" })).toBe(
      "/orders/ord1?view=tracking",
    );
    expect(resolveSmartNotificationHref("listing_sold", { productId: "p1" })).toBe(
      "/saved?highlight=p1",
    );
    expect(resolveSmartNotificationHref("payment_received", { transactionId: "t1" })).toBe(
      "/wallet/transactions/t1",
    );
    expect(resolveSmartNotificationHref("trust_verification")).toBe(NOTIFICATION_ROUTES.settings);

    expect(resolveNotificationTypeHref("follower")).toBe(NOTIFICATION_ROUTES.followers);
    expect(resolveNotificationTypeHref("review")).toBe(NOTIFICATION_ROUTES.reviews);
    expect(resolveNotificationTypeHref("payment", { transactionId: "t2" })).toBe(
      "/wallet/transactions/t2",
    );

    expect(resolveCompletionGapHref("bank", "/wallet/withdraw")).toContain(
      "/wallet/bank-account",
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

    expect(prefs).toContain("Saved Item Sold");
    expect(prefs).toContain("Followed Seller New Listing");
    expect(prefs).toContain("Followers");
    expect(prefs).toContain("Push Notifications");
    expect(prefs).toContain("Email Notifications");
  });
});
