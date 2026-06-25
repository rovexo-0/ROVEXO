import { createAdminClient } from "@/lib/supabase/admin";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function reverseFailedStripeTransfer(transferId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data: transaction } = await admin
    .from("wallet_transactions")
    .select("id, user_id, wallet_id, amount, status, type")
    .eq("stripe_transfer_id", transferId)
    .maybeSingle();

  if (!transaction || transaction.status === "failed" || transaction.status === "refunded") {
    return false;
  }

  const refundAmount = Math.abs(Number(transaction.amount));
  const { data: wallet } = await admin
    .from("wallets")
    .select("pending_balance, available_balance")
    .eq("id", transaction.wallet_id)
    .maybeSingle();

  if (!wallet) {
    return false;
  }

  if (transaction.type === "sale") {
    await admin
      .from("wallets")
      .update({
        pending_balance: roundMoney(Number(wallet.pending_balance) + refundAmount),
      })
      .eq("id", transaction.wallet_id);

    await admin
      .from("wallet_transactions")
      .update({
        status: "pending",
        stripe_transfer_id: null,
        description: `transfer_reversed:${transferId}`,
      })
      .eq("id", transaction.id);
  } else {
    await admin
      .from("wallets")
      .update({
        available_balance: roundMoney(Number(wallet.available_balance) + refundAmount),
      })
      .eq("id", transaction.wallet_id);

    await admin
      .from("wallet_transactions")
      .update({ status: "failed", description: `transfer_failed:${transferId}` })
      .eq("id", transaction.id);
  }

  return true;
}

export async function syncStripeRefundFromCharge(input: {
  paymentIntentId: string;
  refundId: string;
}): Promise<void> {
  const admin = createAdminClient();

  await admin
    .from("orders")
    .update({
      stripe_refund_id: input.refundId,
      refunded_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", input.paymentIntentId)
    .is("stripe_refund_id", null);
}
