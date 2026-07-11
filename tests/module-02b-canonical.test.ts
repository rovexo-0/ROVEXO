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

    expect(account?.items.map((item) => item.title)).toEqual(["Settings"]);
    expect(support?.items.map((item) => item.title)).toEqual(["Help Centre", "Ideas"]);
    expect(support?.items[0]?.href).toBe("/help");
    expect(readSource("lib/account-center/canonical-menu.ts")).not.toContain("Contact Support");
  });

  it("locks Settings hub sections for Module 02B", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");

    expect(settings).toContain('data-settings-version="v1.0-production"');
    expect(settings).toContain('"Profile"');
    expect(settings).toContain('"Addresses"');
    expect(settings).toContain('"Payment Methods"');
    expect(settings).toContain('"Bank Account"');
    expect(settings).toContain("Notification Preferences");
    expect(settings).toContain('"Privacy & Security"');
    expect(settings).toContain('"Regional"');
    expect(settings).toContain('"Legal"');
    expect(settings).toContain("DeleteAccountFlow");
  });

  it("locks wallet financial hub and withdraw flow", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const withdraw = readSource("features/wallet/components/withdraw/WithdrawPage.tsx");
    const withdrawApi = readSource("app/api/wallet/withdraw/route.ts");

    expect(hub).toContain('data-wallet-hub-version="v1.0-production"');
    expect(hub).toContain("Available Balance");
    expect(hub).toContain("Withdraw");
    expect(hub).toContain("Transactions");
    expect(hub).toContain("Annual Statements");
    expect(withdraw).toContain('data-wallet-withdraw-version="v2.0-02b"');
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
      "/inbox?thread=c1",
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
      "/account/settings/bank-account",
    );
    expect(resolveCompletionGapHref("address", "/checkout/item")).toContain("/account/addresses");
    expect(resolveCompletionGapHref("payment", "/checkout/item")).toContain("/account/payment-methods");
  });

  it("embeds help centre topics and contact support inside help", () => {
    const help = readSource("features/help/components/HelpCentreCanonicalSection.tsx");
    const page = readSource("features/help/components/HelpCentrePage.tsx");

    expect(help).toContain('data-help-centre-version="v1.0-legal-lock"');
    expect(help).toContain("Contact Support");
    expect(help).toContain("/support");
    expect(help).toContain("/legal/cookie-policy");
    expect(page).toContain("HelpCentreCanonicalSection");
    expect(page).not.toContain("<HelpQuickLinks");
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
