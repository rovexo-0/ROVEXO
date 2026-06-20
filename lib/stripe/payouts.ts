import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { notifyWithdrawalCompleted } from "@/lib/orders/notifications";
import type { WalletTransaction } from "@/lib/wallet/types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function processStripeWithdrawal(input: {
  userId: string;
  methodId: string;
  amount: number;
}): Promise<WalletTransaction | null> {
  const admin = createAdminClient();
  const supabase = await createClient();

  const { data: method } = await supabase
    .from("withdraw_methods")
    .select("*")
    .eq("user_id", input.userId)
    .eq("id", input.methodId)
    .maybeSingle();

  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!method || !wallet || input.amount <= 0 || input.amount > Number(wallet.available_balance)) {
    return null;
  }

  if (method.provider !== "stripe_connect") {
    return null;
  }

  const { data: sellerProfile } = await admin
    .from("seller_profiles")
    .select("stripe_connect_account_id")
    .eq("id", input.userId)
    .maybeSingle();

  const connectAccountId = sellerProfile?.stripe_connect_account_id;
  if (!connectAccountId) {
    return null;
  }

  const amountCents = Math.round(input.amount * 100);
  const orderNumber = `WD-${Date.now().toString().slice(-8)}`;
  let stripeTransferId: string | null = null;

  if (isStripeConfigured()) {
    try {
      const stripe = getStripeClient();
      const transfer = await stripe.transfers.create(
        {
          amount: amountCents,
          currency: "gbp",
          destination: connectAccountId,
          metadata: {
            userId: input.userId,
            orderNumber,
          },
        },
        { idempotencyKey: `withdraw-${input.userId}-${orderNumber}` },
      );
      stripeTransferId = transfer.id;
    } catch {
      return null;
    }
  } else if (process.env.NODE_ENV === "production") {
    return null;
  } else {
    stripeTransferId = `dev_transfer_${orderNumber}`;
  }

  const newBalance = roundMoney(Number(wallet.available_balance) - input.amount);

  const { error: walletError } = await admin
    .from("wallets")
    .update({ available_balance: newBalance })
    .eq("id", wallet.id)
    .eq("user_id", input.userId);

  if (walletError) {
    return null;
  }

  const { data: transaction } = await admin
    .from("wallet_transactions")
    .insert({
      wallet_id: wallet.id,
      user_id: input.userId,
      order_number: orderNumber,
      product_title: `Withdrawal to ${method.label}`,
      amount: -input.amount,
      status: "completed",
      type: "withdrawal",
      withdraw_method_label: `${method.label} ••${method.last_digits}`,
      stripe_transfer_id: stripeTransferId,
      description: stripeTransferId ? `transfer:${stripeTransferId}` : null,
    })
    .select("*")
    .single();

  if (!transaction) {
    await admin
      .from("wallets")
      .update({ available_balance: Number(wallet.available_balance) })
      .eq("id", wallet.id);
    return null;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.userId)
    .maybeSingle();

  await notifyWithdrawalCompleted({
    sellerId: input.userId,
    sellerEmail: profile?.email ?? "",
    amount: input.amount,
  });

  return {
    id: transaction.id,
    orderNumber: transaction.order_number ?? "",
    productTitle: transaction.product_title,
    productImageUrl: transaction.product_image_url ?? "",
    amount: Number(transaction.amount),
    status: transaction.status,
    type: transaction.type,
    createdAt: transaction.created_at,
    withdrawMethodLabel: transaction.withdraw_method_label ?? undefined,
    description: transaction.description ?? undefined,
  };
}
