/**
 * ROVEXO CLUSTER 7 — WALLET & PAYMENTS
 * SCOPE LOCK v1.0
 *
 * OWNER APPROVED · ARCHITECTURE SCOPE LOCKED
 * Cod Sânge — Cluster 7 · Owner Architecture Decision
 *
 * Equation:
 * Buyer → Checkout → Stripe Payment → Commerce Engine → Ledger → Wallet
 * → Settlement Policy → Withdrawal Engine → Stripe Payout
 * = CLUSTER 7 v1.0 SCOPE LOCK
 *
 * This file is the Cluster 7 Architecture Scope Lock + Production Freeze SSOT.
 * Financial behaviour must not change without Owner re-authorization.
 */

export const CLUSTER_7_WALLET_PAYMENTS_SCOPE_LOCK_V1 = {
  version: "1.0",
  cluster: "CLUSTER_7_WALLET_PAYMENTS",
  id: "cluster-7-wallet-payments-scope-lock-v1",
  status: "OWNER_APPROVED_PRODUCTION_READY_FROZEN",
  approvedByOwner: true,
  scopeLocked: true,
  architectureCertified: true,
  /** Owner Visual QA PASS · Production Freeze applied. */
  productionReady: true,
  freezeApplied: true,
  technicalCertificationPass: true,
  ownerVisualQaPass: true,
  ownerVisualQa: "PASS" as const,
  productionStatus: "CERTIFIED" as const,

  equation:
    "BUYER + CHECKOUT + STRIPE_PAYMENT + COMMERCE_ENGINE + LEDGER + WALLET + SETTLEMENT + WITHDRAWAL + STRIPE_PAYOUT",

  moneyAuthority: {
    commerceEngine: "SOLE_FINANCIAL_AUTHORITY",
    ledger: "SOLE_FINANCIAL_LEDGER",
    wallet: "BALANCE_PROJECTION_LAYER",
    settlement: "RELEASE_AUTHORITY",
    withdrawalEngine: "PAYOUT_AUTHORITY",
    stripe: "EXTERNAL_PAYMENT_PROCESSOR_ONLY",
  } as const,

  canonicalMoneyFlow: [
    "BUYER",
    "CHECKOUT",
    "STRIPE_PAYMENT",
    "COMMERCE_ENGINE",
    "LEDGER",
    "WALLET",
    "SETTLEMENT_POLICY",
    "WITHDRAWAL_ENGINE",
    "STRIPE_PAYOUT",
  ] as const,

  singularity: {
    commerceEngine: "lib/commerce-engine/index.ts",
    ledger: "lib/commerce-engine/ledger.ts",
    walletProjection: "lib/wallet/sales.ts + lib/wallet/store.ts",
    settlement: "lib/commerce-engine/settlement.ts + release-policy.ts",
    withdrawalEngine: "lib/wallet/store.ts → recordWithdrawal + lib/stripe/withdraw-payout.ts",
    stripeProcessor: "lib/stripe/*",
    feeEngine: "lib/orders/pricing.ts",
    financialAudit: "lib/checkout/engines/financial-audit-engine-v1.ts",
    uiHub: "features/wallet/components/WalletHubV1.tsx",
    canonicalRoute: "/wallet",
    balanceAlias: "/balance → /wallet",
  } as const,

  enabledV1: [
    "Wallet",
    "Balance",
    "Pending balance",
    "Transaction history",
    "Buyer payment summary",
    "Seller earnings",
    "Platform fee engine",
    "Stripe Checkout",
    "Settlement",
    "Withdrawals",
    "Financial audit trail",
  ] as const,

  deferredToV1_1: [
    "Buyer Wallet Pay",
    "Multi-currency ledger",
  ] as const,

  deferredGates: {
    buyerWalletPay: {
      status: "DEFERRED_V1_1",
      registryId: "wallet-payment",
      registryEnabled: false,
      ssot: "lib/payments-engine/registry.ts",
    },
    multiCurrencyLedger: {
      status: "DEFERRED_V1_1",
      v1Currency: "GBP",
      note: "v1.0 runtime is GBP-only; multi-currency ledger forbidden without Owner approval",
    },
  } as const,

  runtimeBoundaries: {
    checkoutMustUseCommerceEngine: true,
    ordersMustNotWriteWalletDirectly: true,
    stripeMustNotBypassSettlement: true,
    walletUiMustNotMutateLedger: true,
    adminConfigMustNotBypassMoneyAuthority: true,
    creditMutationEntry: "Commerce Engine only (openEscrowForOrder / creditSeller)",
    withdrawalMutationEntry: "Withdrawal Engine only (recordWithdrawal)",
    walletSalesImplementation:
      "lib/wallet/sales.ts is the balance write implementation under Commerce Engine — not a parallel authority",
  } as const,

  legacy: {
    dualStripeWebhookMount: {
      classification: "COMPATIBILITY",
      canonical: "app/api/stripe/webhook/route.ts",
      legacy: "app/api/webhooks/stripe/route.ts",
      sharedHandler: "lib/stripe/webhook-handler.ts",
      affectsCanonicalRuntime: false,
      note: "Same fail-closed handler; legacy mount is compatibility only",
    },
    withdrawPageV3ToV6: {
      classification: "COMPATIBILITY",
      ssot: "lib/wallet/withdraw-page-v7.ts",
      shims: [
        "lib/wallet/withdraw-page-v3.ts",
        "lib/wallet/withdraw-page-v4.ts",
        "lib/wallet/withdraw-page-v5.ts",
        "lib/wallet/withdraw-page-v6.ts",
      ],
      affectsCanonicalRuntime: false,
      note: "Deprecated re-exports to v7 — no parallel withdraw runtime",
    },
    balanceV1Css: {
      classification: "DEAD",
      path: "styles/rovexo/balance-v1.css",
      wiredInIndexCss: false,
      affectsCanonicalRuntime: false,
      note: "Orphan CSS; live hub uses wallet-hub / wallet-v2 presentation classes",
    },
  } as const,

  permanentlyForbidden: [
    "Second financial ledger",
    "Second wallet mutation path outside Commerce Engine / Withdrawal Engine",
    "Orders writing seller balance without Commerce Engine",
    "Wallet UI mutating ledger or balances",
    "Admin wallet-engine / payments-engine bypassing runtime money authority",
    "Enabling Buyer Wallet Pay in v1.0 without Owner approval",
    "Multi-currency ledger in v1.0 without Owner approval",
    "Alternative payment processor as live money path without Owner approval",
  ] as const,

  nextGates: [
    "Technical Certification",
    "Owner Visual QA",
    "Production Freeze",
  ] as const,

  ssot: "lib/wallet/cluster-7-wallet-payments-scope-lock-v1.ts",
} as const;

export type Cluster7WalletPaymentsScopeLockV1 =
  typeof CLUSTER_7_WALLET_PAYMENTS_SCOPE_LOCK_V1;

export function getCluster7WalletPaymentsScopeLockSnapshot() {
  return CLUSTER_7_WALLET_PAYMENTS_SCOPE_LOCK_V1;
}

export function assertCluster7WalletPaymentsArchitectureOrBlock(): void {
  const lock = CLUSTER_7_WALLET_PAYMENTS_SCOPE_LOCK_V1;
  if (!lock.approvedByOwner || !lock.scopeLocked || !lock.architectureCertified) {
    throw new Error("CLUSTER 7 Wallet & Payments Scope Lock is not Owner-approved.");
  }
  if (lock.moneyAuthority.commerceEngine !== "SOLE_FINANCIAL_AUTHORITY") {
    throw new Error("CLUSTER 7 invariant broken: Commerce Engine must be sole financial authority.");
  }
  if (lock.deferredGates.buyerWalletPay.registryEnabled !== false) {
    throw new Error("CLUSTER 7 invariant broken: Buyer Wallet Pay must remain deferred/disabled.");
  }
}
