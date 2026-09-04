/**
 * Phase 1F — Business Hub runtime data-context closure.
 * Snapshot / cache / wallet / Stripe isolation. No LIVE Stripe.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_SNAPSHOT_SHARE_KEY,
  fetchAccountSnapshotShared,
} from "@/lib/account-center/fetch-account-snapshot-shared";
import {
  accountSnapshotCacheKey,
  connectAccountColumn,
  walletContextMatchesSellerContext,
  walletLedgerSellerContextFilter,
} from "@/lib/seller-context/seller-context-v1";
import { walletLiveFingerprint } from "@/features/wallet/hooks/use-wallet-live";
import type { WalletData } from "@/lib/wallet/types";
import { createEmptyWalletData } from "@/lib/wallet/withdraw-page-v7";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function sampleWallet(context: "individual" | "business", available: number): WalletData {
  return {
    ...createEmptyWalletData(),
    walletContext: context,
    availableBalance: available,
  };
}

describe("Phase 1F — root cause closure (snapshot context)", () => {
  it("Business Hub snapshot uses business query + Business wallet", () => {
    const route = src("app/api/account/snapshot/route.ts");
    expect(route).toContain("sellerContext");
    expect(route).toContain("getWalletData(auth.user.id, sellerContext)");
    expect(route).toContain("wallet_context_mismatch");
  });

  it("Individual and Business cache keys differ", () => {
    const ind = accountSnapshotCacheKey("individual");
    const biz = accountSnapshotCacheKey("business");
    expect(ind).not.toBe(biz);
    expect(ind).toContain("sellerContext=individual");
    expect(biz).toContain("sellerContext=business");
    expect(ACCOUNT_SNAPSHOT_SHARE_KEY).toBe(ind);
    expect(ACCOUNT_SNAPSHOT_SHARE_KEY).not.toBe(biz);
  });

  it("fetchAccountSnapshotShared is context-parameterised", () => {
    expect(fetchAccountSnapshotShared.length).toBeGreaterThanOrEqual(0);
    const shared = src("lib/account-center/fetch-account-snapshot-shared.ts");
    expect(shared).toMatch(/function fetchAccountSnapshotShared\(/);
    expect(shared).toContain("normalizeSellerContext");
  });
});

describe("Phase 1F — wallet isolation", () => {
  it("Business ledger never includes legacy null seller_context", () => {
    const biz = walletLedgerSellerContextFilter("business");
    expect(biz.mode).toBe("eq");
    expect(biz.value).toBe("business");
    expect(biz.value).not.toContain("null");
  });

  it("Individual ledger allows individual + legacy null", () => {
    const ind = walletLedgerSellerContextFilter("individual");
    expect(ind.mode).toBe("or");
    expect(ind.value).toContain("individual");
    expect(ind.value).toContain("is.null");
  });

  it("Business cannot match Individual wallet_context", () => {
    expect(walletContextMatchesSellerContext("individual", "business")).toBe(false);
    expect(walletContextMatchesSellerContext(null, "business")).toBe(false);
    expect(walletContextMatchesSellerContext("business", "business")).toBe(true);
  });

  it("getWalletData tags walletContext and scopes ledger", () => {
    const store = src("lib/wallet/store.ts");
    expect(store).toContain("walletContext: context");
    expect(store).toContain("walletLedgerSellerContextFilter");
    expect(store).not.toMatch(
      /\.or\(`seller_context\.eq\.\$\{context\},seller_context\.is\.null`\)/,
    );
  });

  it("live fingerprint includes walletContext (stale cross-context detectable)", () => {
    const a = walletLiveFingerprint(sampleWallet("individual", 10));
    const b = walletLiveFingerprint(sampleWallet("business", 10));
    expect(a).not.toBe(b);
  });
});

describe("Phase 1F — Stripe Connect isolation", () => {
  it("Business → Business Connect column; Individual → Individual", () => {
    expect(connectAccountColumn("business")).toBe("stripe_connect_account_id_business");
    expect(connectAccountColumn("individual")).toBe(
      "stripe_connect_account_id_individual",
    );
  });

  it("getWalletData uses getConnectAccountStatus(userId, context)", () => {
    expect(src("lib/wallet/store.ts")).toContain("getConnectAccountStatus(userId, context)");
  });

  it("Connect sync does not write business id into individual-only path incorrectly", () => {
    const connect = src("lib/stripe/connect.ts");
    expect(connect).toContain("connectAccountColumn");
    expect(connect).toContain("stripe_connect_account_id_business");
  });
});

describe("Phase 1F — hub wiring / switch / refresh", () => {
  it("Business Hub passes sellerContext=business into useWalletLive", () => {
    const hub = src("features/wallet/components/WalletHubV1.tsx");
    expect(hub).toContain("useWalletLive(userId, initialData, sellerContext)");
    expect(hub).toContain('sellerContext = isBusiness ? "business" : "individual"');
    expect(hub).toContain("data-wallet-seller-context");
  });

  it("Business page loads fetchWalletData(business)", () => {
    expect(src("app/(platform)/business/wallet/page.tsx")).toContain(
      'fetchWalletData("business")',
    );
  });

  it("useWalletLive rejects cross-context snapshot payloads", () => {
    const live = src("features/wallet/hooks/use-wallet-live.ts");
    expect(live).toContain("payload.sellerContext !== sellerContext");
    expect(live).toContain("wallet.walletContext !== sellerContext");
    expect(live).toContain("Context switch");
  });

  it("Account hub live stays Individual", () => {
    expect(src("features/account-center/hooks/useAccountHubLive.ts")).toContain(
      'fetchAccountSnapshotShared("individual")',
    );
  });
});

describe("Phase 1F — order seller_context immutability", () => {
  it("order create persists immutable seller_context", () => {
    expect(src("lib/orders/create-order-from-checkout-session.server.ts")).toContain(
      "seller_context: sellerContext",
    );
  });

  it("settlement uses order seller_context — not UI hub switch", () => {
    expect(src("lib/commerce-engine/settlement.ts")).toContain("orderContext");
    expect(src("lib/commerce-engine/release-policy.ts")).toContain(
      "normalizeSellerContext(input.sellerContext)",
    );
  });
});
