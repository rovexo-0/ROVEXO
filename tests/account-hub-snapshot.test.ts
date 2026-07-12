import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ACCOUNT_HUB_ACTIVE_ORDER_STATUSES } from "@/lib/account-center/constants";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Account hub live profile stats", () => {
  it("uses profile-stats as the single snapshot data source", () => {
    const snapshot = readSource("lib/account-center/snapshot.ts");
    const profileStats = readSource("lib/account-center/profile-stats.ts");

    expect(snapshot).toContain("countAccountActiveListings");
    expect(snapshot).toContain("countAccountActiveOrders");
    expect(snapshot).toContain("countAccountSavedItems");
    expect(snapshot).toContain("getAccountReviewSummary");
    expect(snapshot).toContain("countAccountFollowers");
    expect(snapshot).not.toContain("countAccountFollowing");
    expect(snapshot).not.toContain("getTrustDashboardData");
    expect(snapshot).not.toContain("fetchOrdersForUser");
    expect(snapshot).not.toContain("listSavedItems");
    expect(profileStats).toContain('eq("status", "published")');
    expect(profileStats).toContain('.gt("stock", 0)');
    expect(profileStats).toContain("seller_profiles");
  });

  it("counts only active marketplace orders on the hub", () => {
    expect(ACCOUNT_HUB_ACTIVE_ORDER_STATUSES).toEqual([
      "awaiting_payment",
      "awaiting_shipment",
      "shipped",
      "issue_open",
    ]);
    expect(ACCOUNT_HUB_ACTIVE_ORDER_STATUSES).not.toContain("completed");
    expect(ACCOUNT_HUB_ACTIVE_ORDER_STATUSES).not.toContain("cancelled");
    expect(ACCOUNT_HUB_ACTIVE_ORDER_STATUSES).not.toContain("delivered");
  });

  it("exposes a snapshot API and live client refresh hook", () => {
    const route = readSource("app/api/account/snapshot/route.ts");
    const hook = readSource("features/account-center/hooks/useAccountHubLive.ts");
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const realtime = readSource("lib/account-center/realtime.ts");

    expect(route).toContain("fetchAccountHubSnapshot");
    expect(route).toContain("getWalletData");
    expect(hook).toContain("subscribeToAccountHubStats");
    expect(hook).toContain('fetchDeduped("/api/account/snapshot"');
    expect(home).toContain("useAccountHubLive");
    expect(realtime).toContain("saved_items");
    expect(realtime).toContain("wallet_transactions");
  });
});
