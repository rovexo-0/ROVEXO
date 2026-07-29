import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLUSTER_7_WALLET_PAYMENTS_SCOPE_LOCK_V1,
  assertCluster7WalletPaymentsArchitectureOrBlock,
} from "@/lib/wallet/cluster-7-wallet-payments-scope-lock-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Cluster 7 Wallet & Payments Scope Lock", () => {
  const lock = CLUSTER_7_WALLET_PAYMENTS_SCOPE_LOCK_V1;

  it("is Owner-approved architecture Scope Locked (not Production Freeze)", () => {
    expect(lock.approvedByOwner).toBe(true);
    expect(lock.scopeLocked).toBe(true);
    expect(lock.architectureCertified).toBe(true);
    expect(lock.cluster).toBe("CLUSTER_7_WALLET_PAYMENTS");
    expect(lock.productionReady).toBe(true);
    expect(lock.freezeApplied).toBe(true);
    expect(lock.technicalCertificationPass).toBe(true);
    expect(lock.ownerVisualQaPass).toBe(true);
    expect(lock.ownerVisualQa).toBe("PASS");
    expect(lock.productionStatus).toBe("CERTIFIED");
    expect(lock.moneyAuthority.commerceEngine).toBe("SOLE_FINANCIAL_AUTHORITY");
    expect(lock.moneyAuthority.ledger).toBe("SOLE_FINANCIAL_LEDGER");
    expect(lock.moneyAuthority.wallet).toBe("BALANCE_PROJECTION_LAYER");
    expect(lock.moneyAuthority.settlement).toBe("RELEASE_AUTHORITY");
    expect(lock.moneyAuthority.withdrawalEngine).toBe("PAYOUT_AUTHORITY");
    expect(lock.moneyAuthority.stripe).toBe("EXTERNAL_PAYMENT_PROCESSOR_ONLY");
    expect(lock.canonicalMoneyFlow).toEqual([
      "BUYER",
      "CHECKOUT",
      "STRIPE_PAYMENT",
      "COMMERCE_ENGINE",
      "LEDGER",
      "WALLET",
      "SETTLEMENT_POLICY",
      "WITHDRAWAL_ENGINE",
      "STRIPE_PAYOUT",
    ]);
    expect(lock.deferredToV1_1).toContain("Buyer Wallet Pay");
    expect(lock.deferredToV1_1).toContain("Multi-currency ledger");
    assertCluster7WalletPaymentsArchitectureOrBlock();
  });

  it("keeps credit/refund mutation behind Commerce Engine (Orders do not write wallet sales)", () => {
    for (const file of [
      "lib/orders/post-payment.server.ts",
      "lib/orders/store.ts",
      "lib/orders/cancel-order.server.ts",
      "lib/orders/checkout.ts",
    ]) {
      const source = readSource(file);
      expect(source, file).not.toMatch(/creditSellerForOrder\s*\(/);
      expect(source, file).not.toMatch(/refundSellerForOrder\s*\(/);
    }

    const postPayment = readSource("lib/orders/post-payment.server.ts");
    expect(postPayment).toContain("openEscrowForOrder");
    expect(postPayment).toContain('from "@/lib/commerce-engine"');

    const cancel = readSource("lib/orders/cancel-order.server.ts");
    expect(cancel).toContain("CommerceEngine.refundSeller");

    const commerce = readSource("lib/commerce-engine/index.ts");
    expect(commerce).toContain("creditSellerForOrder");
    expect(commerce).toContain("recordEscrowEvent");
  });

  it("defers Buyer Wallet Pay and locks Withdraw v7 + dead balance-v1 CSS", () => {
    const registry = readSource("lib/payments-engine/registry.ts");
    expect(registry).toMatch(/id:\s*"wallet-payment"[\s\S]*?enabled:\s*false/);

    expect(lock.deferredGates.buyerWalletPay.registryEnabled).toBe(false);

    const v7 = readSource("lib/wallet/withdraw-page-v7.ts");
    expect(v7.length).toBeGreaterThan(0);

    for (const shim of lock.legacy.withdrawPageV3ToV6.shims) {
      const source = readSource(shim);
      expect(source).toContain("withdraw-page-v7");
      expect(source).toMatch(/@deprecated|deprecated/i);
    }

    const indexCss = readSource("styles/rovexo/index.css");
    expect(indexCss).not.toContain("balance-v1.css");
    expect(lock.legacy.balanceV1Css.classification).toBe("DEAD");
  });

  it("classifies dual Stripe webhook as compatibility sharing one handler", () => {
    const canonical = readSource("app/api/stripe/webhook/route.ts");
    const legacy = readSource("app/api/webhooks/stripe/route.ts");
    expect(canonical).toContain("handleStripeWebhookEvent");
    expect(legacy).toContain("handleStripeWebhookEvent");
    expect(legacy).toMatch(/[Ll]egacy/);
    expect(lock.legacy.dualStripeWebhookMount.classification).toBe("COMPATIBILITY");
    expect(lock.legacy.dualStripeWebhookMount.affectsCanonicalRuntime).toBe(false);
  });

  it("keeps Wallet UI as projection (no ledger mutation imports)", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    expect(hub).not.toContain("recordEscrowEvent");
    expect(hub).not.toContain("creditSellerForOrder");
    expect(hub).not.toContain("recordWithdrawal");
  });
});
