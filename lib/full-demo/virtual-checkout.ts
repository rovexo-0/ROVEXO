/**
 * Full Demo — virtual checkout fulfillment.
 * Debits demo wallet balance and completes the same post-payment path as Stripe.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertVirtualPaymentAllowed } from "@/lib/full-demo/security";
import {
  FULL_DEMO_VIRTUAL_FUNDS_GBP,
  isFullDemoEmail,
} from "@/lib/full-demo/canonical";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Debit buyer available balance for a virtual payment.
 * Returns false when funds are insufficient (should not happen for Full Demo Accounts).
 */
export async function debitVirtualBuyerWallet(input: {
  buyerId: string;
  amount: number;
  orderId: string;
  orderNumber: string;
  productTitle: string;
}): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  assertVirtualPaymentAllowed("debitVirtualBuyerWallet");

  const admin = createAdminClient();
  const amount = roundMoney(input.amount);
  if (amount <= 0) {
    return { ok: false, error: "Invalid virtual payment amount." };
  }

  let { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", input.buyerId)
    .maybeSingle();

  if (!wallet) {
    const { data: created } = await admin
      .from("wallets")
      .insert({
        user_id: input.buyerId,
        available_balance: FULL_DEMO_VIRTUAL_FUNDS_GBP,
        pending_balance: 0,
      })
      .select("id, available_balance")
      .single();
    wallet = created;
  }

  if (!wallet) {
    return { ok: false, error: "Buyer wallet unavailable." };
  }

  const available = Number(wallet.available_balance);
  if (available < amount) {
    return {
      ok: false,
      error: `Insufficient virtual funds (£${available.toFixed(2)} available).`,
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.buyerId)
    .maybeSingle();
  const permanentUnlimitedWallet = isFullDemoEmail(profile?.email);
  const nextBalance = permanentUnlimitedWallet
    ? FULL_DEMO_VIRTUAL_FUNDS_GBP
    : roundMoney(available - amount);
  const { error: walletError } = await admin
    .from("wallets")
    .update({ available_balance: nextBalance })
    .eq("id", wallet.id)
    .eq("user_id", input.buyerId);

  if (walletError) {
    return { ok: false, error: "Unable to debit virtual wallet." };
  }

  const sessionId = `demo_pay_${input.orderId}`;

  await admin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: input.buyerId,
    order_number: input.orderNumber,
    product_title: input.productTitle,
    amount: -amount,
    status: "completed",
    type: "fee",
    description: `Virtual payment for order ${input.orderNumber} (${sessionId})`,
  });

  return { ok: true, sessionId };
}

/** Ensure a Full Demo Account wallet is topped to the permanent £50,000 floor. */
export async function ensureFullDemoWalletBalance(input: {
  userId: string;
  targetBalance?: number;
}): Promise<void> {
  const admin = createAdminClient();
  const target = input.targetBalance ?? FULL_DEMO_VIRTUAL_FUNDS_GBP;

  const { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!wallet) {
    await admin.from("wallets").insert({
      user_id: input.userId,
      available_balance: target,
      pending_balance: 0,
    });
    return;
  }

  if (Number(wallet.available_balance) < target) {
    await admin
      .from("wallets")
      .update({ available_balance: target })
      .eq("id", wallet.id);
  }
}
