/**
 * ROVEXO Wallet Security Certification — user withdrawal payout rail.
 *
 * Flow (fail closed):
 *   validate Connect → transfer (or virtual) → caller confirms or rolls back.
 * Never marks ledger COMPLETED here. Never invents money movement under uncertainty.
 */

import { logPaymentError } from "@/lib/ops/logger";
import { getConnectAccountStatus } from "@/lib/stripe/connect";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { mustUseVirtualWallet } from "@/lib/full-demo/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWalletMoneyEnvReady, MISSING_REQUIRED_SECRET } from "@/lib/wallet/env-validation";
import { roundWalletMoney } from "@/lib/wallet/security";
import type { WithdrawMethodProvider } from "@/lib/wallet/types";

export type WithdrawPayoutResult =
  | { success: true; transferId: string; virtual: boolean }
  | { success: false; error: string; retryable: boolean };

export type WithdrawRailReadiness =
  | { ready: true; connectAccountId: string | null; virtual: boolean }
  | { ready: false; error: string };

/**
 * Live withdraw rail requires Stripe Connect with payouts enabled.
 * Bank-account method still settles via Connect (Express bank destination).
 * Virtual / Full Demo uses a non-Stripe transfer id only.
 */
export async function assertWithdrawalRailReady(
  userId: string,
  provider: WithdrawMethodProvider,
): Promise<WithdrawRailReadiness> {
  if (mustUseVirtualWallet()) {
    return { ready: true, connectAccountId: null, virtual: true };
  }

  if (!isStripeConfigured()) {
    return { ready: false, error: "Stripe is not configured." };
  }

  const admin = createAdminClient();
  const { data: sellerProfile } = await admin
    .from("seller_profiles")
    .select("stripe_connect_account_id")
    .eq("id", userId)
    .maybeSingle();

  const connectAccountId = sellerProfile?.stripe_connect_account_id ?? null;
  if (!connectAccountId) {
    return {
      ready: false,
      error: "Stripe Connect account required before withdrawals.",
    };
  }

  const status = await getConnectAccountStatus(userId);
  if (!status.connected || !status.payoutsEnabled) {
    return {
      ready: false,
      error: "Stripe Connect payouts are not enabled.",
    };
  }

  if (provider !== "bank_account" && provider !== "stripe_connect") {
    return { ready: false, error: "Unknown withdraw method provider." };
  }

  return { ready: true, connectAccountId, virtual: false };
}

/**
 * Move locked withdrawal funds to the seller Connect account.
 * Metadata enables fail-closed webhook reconciliation.
 */
export async function initiateWithdrawalPayout(input: {
  userId: string;
  transactionId: string;
  amount: number;
  methodProvider: WithdrawMethodProvider;
  idempotencyKey: string;
}): Promise<WithdrawPayoutResult> {
  if (!isWalletMoneyEnvReady("withdraw")) {
    return { success: false, error: MISSING_REQUIRED_SECRET, retryable: false };
  }

  const amount = roundWalletMoney(input.amount);
  const amountCents = Math.round(amount * 100);
  if (!(amountCents > 0)) {
    return { success: false, error: "Invalid withdrawal amount.", retryable: false };
  }

  const rail = await assertWithdrawalRailReady(input.userId, input.methodProvider);
  if (!rail.ready) {
    return { success: false, error: rail.error, retryable: false };
  }

  if (rail.virtual) {
    return {
      success: true,
      transferId: `demo_withdraw_${input.transactionId}`,
      virtual: true,
    };
  }

  if (!rail.connectAccountId) {
    return {
      success: false,
      error: "Connect account missing after readiness check.",
      retryable: false,
    };
  }

  try {
    const stripe = getStripeClient();
    const transfer = await stripe.transfers.create(
      {
        amount: amountCents,
        currency: "gbp",
        destination: rail.connectAccountId,
        metadata: {
          userId: input.userId,
          walletTransactionId: input.transactionId,
          purpose: "wallet_withdrawal",
          methodProvider: input.methodProvider,
        },
        description: `ROVEXO withdrawal ${input.transactionId}`,
      },
      { idempotencyKey: `wallet-withdraw-${input.idempotencyKey}` },
    );

    return { success: true, transferId: transfer.id, virtual: false };
  } catch (error) {
    logPaymentError("Stripe withdrawal transfer failed", error, {
      userId: input.userId,
      transactionId: input.transactionId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Withdrawal transfer failed.",
      retryable: true,
    };
  }
}

/** Reverse a Connect transfer after a failed / cancelled withdrawal (fail closed). */
export async function reverseWithdrawalTransfer(input: {
  transferId: string;
  amount: number;
  idempotencyKey: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  if (input.transferId.startsWith("demo_withdraw_") || input.transferId.startsWith("dev_withdraw_")) {
    return { success: true };
  }

  if (!isStripeConfigured()) {
    return { success: false, error: "Stripe is not configured for reversal." };
  }

  const amountCents = Math.round(roundWalletMoney(input.amount) * 100);
  if (!(amountCents > 0)) {
    return { success: false, error: "Invalid reversal amount." };
  }

  try {
    const stripe = getStripeClient();
    await stripe.transfers.createReversal(
      input.transferId,
      { amount: amountCents },
      { idempotencyKey: `wallet-withdraw-reversal-${input.idempotencyKey}` },
    );
    return { success: true };
  } catch (error) {
    logPaymentError("Stripe withdrawal reversal failed", error, {
      transferId: input.transferId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Reversal failed.",
    };
  }
}
