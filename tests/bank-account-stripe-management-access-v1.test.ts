/**
 * Bank Account → Stripe Connect management access (LAN blocker regression).
 * Auth must be requireApiAuth (unified account). Never role-gate buyers as Forbidden.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveConnectAccountIdForContext } from "@/lib/stripe/connect";

function src(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Bank Account Stripe management access fix", () => {
  it("Connect API authenticates any signed-in ROVEXO user (not seller-role-only)", () => {
    const route = src("app/api/wallet/connect/route.ts");
    expect(route).toContain("requireApiAuth");
    expect(route).not.toContain('requireApiRole(["seller", "business", "admin"])');
    expect(route).toContain("createConnectManageLink");
    expect(route).toContain('context === "business"');
    expect(route).toContain("resolveConnectAccountIdForContext");
    expect(route).not.toContain("dashboard.stripe.com");
  });

  it("Bank Accounts UI opens Stripe manage without Forbidden copy trap", () => {
    const page = src("features/wallet/components/WalletBankAccountsPage.tsx");
    expect(page).toContain("mapConnectFailure");
    expect(page).not.toContain("Open Stripe to continue.");
    expect(page).toContain("Manage on Stripe");
    expect(page).toContain("Change bank account");
    expect(page).toContain("Resolve on Stripe");
    expect(page).toContain("Your bank details are securely managed by Stripe.");
    expect(page).not.toContain("BankAccountForm");
  });

  it("return/refresh URLs target Bank Accounts with context + sync", () => {
    const connect = src("lib/stripe/connect.ts");
    const bankPage = src("app/(platform)/wallet/bank-accounts/page.tsx");
    expect(connect).toContain("/wallet/bank-accounts?connect=success");
    expect(connect).toContain("sellerContext=business&connect=success");
    expect(bankPage).toContain("syncConnectAccountBySellerId");
    expect(bankPage).toContain('"business"');
    expect(bankPage).toContain('"individual"');
  });

  it("Business Connect isolation never uses Individual account id", () => {
    expect(
      resolveConnectAccountIdForContext(
        {
          stripe_connect_account_id: "acct_legacy",
          stripe_connect_account_id_individual: "acct_ind",
          stripe_connect_account_id_business: null,
        },
        "business",
      ),
    ).toBeNull();
    expect(
      resolveConnectAccountIdForContext(
        {
          stripe_connect_account_id_individual: "acct_ind",
          stripe_connect_account_id_business: "acct_biz",
        },
        "business",
      ),
    ).toBe("acct_biz");
  });

  it("getAppBaseUrl is async so LAN Origin/Referer is readable", () => {
    const server = src("lib/stripe/server.ts");
    expect(server).toContain("export async function getAppBaseUrl");
    expect(server).toContain("await nextHeaders()");
    expect(server).toContain('process.env.VERCEL_ENV === "production"');
    expect(server).toContain("return getAppUrl()");
  });

  it("Individual Connect create includes Stripe responsibilities (recipient requirement)", () => {
    const connect = src("lib/stripe/connect.ts");
    expect(connect).toContain('fees_collector: "application"');
    expect(connect).toContain('losses_collector: "application"');
    // Must not gate responsibilities to business-only (Stripe now requires both).
    expect(connect).toContain("stripe_balance.stripe_transfers");
    expect(connect).toMatch(/responsibilities:\s*\{\s*fees_collector/);
  });
});
