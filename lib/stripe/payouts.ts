import { createAdminClient } from "@/lib/supabase/admin";
import { logPaymentError } from "@/lib/ops/logger";
import { notifyPayoutTransferred } from "@/lib/orders/notifications";
import { getConnectAccountStatus } from "@/lib/stripe/connect";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseOrderIdFromDescription(description: string | null): string | null {
  if (!description?.startsWith("order:")) {
    return null;
  }
  const orderId = description.slice("order:".length).trim();
  return orderId || null;
}

export type TransferSalePayoutResult =
  | { success: true; transferId: string }
  | { success: false; error: string; retryable: boolean };

export async function transferSalePayoutToConnect(input: {
  saleTransactionId: string;
  userId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  connectAccountId: string;
}): Promise<TransferSalePayoutResult> {
  const admin = createAdminClient();
  const amountCents = Math.round(input.amount * 100);

  if (amountCents <= 0) {
    return { success: false, error: "Invalid payout amount.", retryable: false };
  }

  let transferId: string;

  if (isStripeConfigured()) {
    try {
      const stripe = getStripeClient();
      const transfer = await stripe.transfers.create(
        {
          amount: amountCents,
          currency: "gbp",
          destination: input.connectAccountId,
          metadata: {
            userId: input.userId,
            orderId: input.orderId,
            orderNumber: input.orderNumber,
            saleTransactionId: input.saleTransactionId,
          },
        },
        { idempotencyKey: `order-payout-${input.orderId}` },
      );
      transferId = transfer.id;
    } catch (error) {
      logPaymentError("Stripe sale payout transfer failed", error, {
        orderId: input.orderId,
        userId: input.userId,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transfer failed.",
        retryable: true,
      };
    }
  } else if (process.env.NODE_ENV === "production") {
    return { success: false, error: "Stripe is not configured.", retryable: true };
  } else {
    transferId = `dev_transfer_${input.orderId}`;
  }

  const { data: saleTx } = await admin
    .from("wallet_transactions")
    .select("id, wallet_id, amount, status, stripe_transfer_id")
    .eq("id", input.saleTransactionId)
    .maybeSingle();

  if (!saleTx || saleTx.stripe_transfer_id) {
    return { success: true, transferId: saleTx?.stripe_transfer_id ?? transferId };
  }

  const { data: wallet } = await admin
    .from("wallets")
    .select("pending_balance")
    .eq("id", saleTx.wallet_id)
    .maybeSingle();

  if (!wallet) {
    return { success: false, error: "Wallet not found.", retryable: false };
  }

  const sellerAmount = Number(saleTx.amount);
  const nextPending = Math.max(0, roundMoney(Number(wallet.pending_balance) - sellerAmount));

  const { error: walletError } = await admin
    .from("wallets")
    .update({ pending_balance: nextPending })
    .eq("id", saleTx.wallet_id);

  if (walletError) {
    return { success: false, error: "Unable to update wallet ledger.", retryable: true };
  }

  const { error: txError } = await admin
    .from("wallet_transactions")
    .update({
      status: "completed",
      stripe_transfer_id: transferId,
      description: `order:${input.orderId}|transfer:${transferId}`,
    })
    .eq("id", input.saleTransactionId)
    .is("stripe_transfer_id", null);

  if (txError) {
    await admin
      .from("wallets")
      .update({ pending_balance: Number(wallet.pending_balance) })
      .eq("id", saleTx.wallet_id);
    return { success: false, error: "Unable to record payout.", retryable: true };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.userId)
    .maybeSingle();

  await notifyPayoutTransferred({
    sellerId: input.userId,
    sellerEmail: profile?.email ?? "",
    amount: sellerAmount,
    orderNumber: input.orderNumber,
  });

  return { success: true, transferId };
}

/**
 * After the hold period, transfer eligible sale ledger entries to the seller's Connect account.
 * Stripe Express then pays out to the seller's bank automatically.
 */
export async function processAutomaticSellerPayouts(): Promise<number> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: eligibleSales } = await admin
    .from("wallet_transactions")
    .select("id, user_id, order_number, amount, description, payout_available_at")
    .eq("type", "sale")
    .eq("status", "pending")
    .is("stripe_transfer_id", null)
    .lte("payout_available_at", now)
    .order("payout_available_at", { ascending: true })
    .limit(100);

  if (!eligibleSales?.length) {
    return 0;
  }

  let transferred = 0;

  for (const sale of eligibleSales) {
    const orderId = parseOrderIdFromDescription(sale.description);
    if (!orderId) {
      logPaymentError("Sale payout missing order id in description", null, {
        saleTransactionId: sale.id,
      });
      continue;
    }

    const { data: sellerProfile } = await admin
      .from("seller_profiles")
      .select("stripe_connect_account_id")
      .eq("id", sale.user_id)
      .maybeSingle();

    const connectAccountId = sellerProfile?.stripe_connect_account_id;
    if (!connectAccountId) {
      continue;
    }

    const connectStatus = await getConnectAccountStatus(sale.user_id);
    if (!connectStatus.connected || !connectStatus.payoutsEnabled) {
      continue;
    }

    const result = await transferSalePayoutToConnect({
      saleTransactionId: sale.id,
      userId: sale.user_id,
      orderId,
      orderNumber: sale.order_number ?? orderId,
      amount: Number(sale.amount),
      connectAccountId,
    });

    if (result.success) {
      transferred += 1;
    }
  }

  return transferred;
}
