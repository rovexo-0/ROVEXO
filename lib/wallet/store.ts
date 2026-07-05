import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getConnectAccountStatus } from "@/lib/stripe/connect";
import { decryptSensitive, encryptSensitive } from "@/lib/wallet/crypto";
import type { Tables } from "@/lib/supabase/types/database";
import type { WalletData, WalletTransaction, WithdrawMethod } from "@/lib/wallet/types";

function mapTransaction(row: Tables<"wallet_transactions">): WalletTransaction {
  return {
    id: row.id,
    orderNumber: row.order_number ?? "",
    productTitle: row.product_title,
    productImageUrl: row.product_image_url ?? "",
    amount: Number(row.amount),
    status: row.status,
    type: row.type,
    createdAt: row.created_at,
    payoutAvailableAt: row.payout_available_at ?? undefined,
    withdrawMethodLabel: row.withdraw_method_label ?? undefined,
    feeAmount: row.fee_amount != null ? Number(row.fee_amount) : undefined,
    description: row.description ?? undefined,
    stripeTransferId: row.stripe_transfer_id ?? undefined,
  };
}

function mapWithdrawMethod(row: Tables<"withdraw_methods">): WithdrawMethod {
  return {
    id: row.id,
    provider: row.provider,
    label: row.label,
    lastDigits: row.last_digits,
    connected: row.connected,
  };
}

export async function getWalletData(userId: string): Promise<WalletData> {
  const supabase = await createClient();
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: monthTransactions }, { data: transactions }, { data: methods }, { data: paidOutRows }, connectStatus] =
    await Promise.all([
      supabase
        .from("wallet_transactions")
        .select("amount, type, status, stripe_transfer_id")
        .eq("user_id", userId)
        .gte("created_at", monthStart),
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("withdraw_methods")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("wallet_transactions")
        .select("amount")
        .eq("user_id", userId)
        .eq("type", "sale")
        .eq("status", "completed")
        .not("stripe_transfer_id", "is", null),
      getConnectAccountStatus(userId),
    ]);

  const monthRevenue =
    monthTransactions
      ?.filter((tx) => tx.type === "sale")
      .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0;

  const monthPaidOut =
    monthTransactions
      ?.filter((tx) => tx.type === "sale" && tx.status === "completed" && tx.stripe_transfer_id)
      .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0;

  const monthWithdrawn = Math.abs(
    monthTransactions
      ?.filter((tx) => tx.type === "withdrawal")
      .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0,
  );

  const paidOutBalance =
    paidOutRows?.reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0;

  const monthFees = Math.abs(
    monthTransactions
      ?.filter((tx) => tx.type === "fee")
      .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0,
  );

  return {
    availableBalance: Number(wallet?.available_balance ?? 0),
    pendingBalance: Number(wallet?.pending_balance ?? 0),
    pendingAvailableAt: wallet?.pending_available_at ?? new Date().toISOString(),
    paidOutBalance,
    monthSummary: {
      revenue: { value: monthRevenue, changePercent: 0 },
      withdrawn: { value: monthPaidOut + monthWithdrawn, changePercent: 0 },
      fees: { value: monthFees, changePercent: 0 },
    },
    transactions: (transactions ?? []).map(mapTransaction),
    withdrawMethods: (methods ?? []).map(mapWithdrawMethod),
    connectStatus,
  };
}

export async function listWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapTransaction);
}

export async function getWalletTransactionById(
  userId: string,
  id: string,
): Promise<WalletTransaction | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  return data ? mapTransaction(data) : null;
}

export async function listWithdrawMethods(userId: string): Promise<WithdrawMethod[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("withdraw_methods")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return (data ?? []).map(mapWithdrawMethod);
}

export async function getWithdrawMethodById(
  userId: string,
  id: string,
): Promise<WithdrawMethod | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("withdraw_methods")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  return data ? mapWithdrawMethod(data) : null;
}

/**
 * Save (replace) the user's native ROVEXO bank account. A user has a single
 * payout bank account, so any existing bank_account method is replaced. Only
 * masked details ever reach the client (see mapWithdrawMethod).
 */
export async function saveBankAccount(input: {
  userId: string;
  accountHolderName: string;
  sortCode: string;
  accountNumber: string;
}): Promise<WithdrawMethod | null> {
  const admin = createAdminClient();

  await admin
    .from("withdraw_methods")
    .delete()
    .eq("user_id", input.userId)
    .eq("provider", "bank_account");

  const { data, error } = await admin
    .from("withdraw_methods")
    .insert({
      user_id: input.userId,
      provider: "bank_account",
      label: "Bank account",
      last_digits: input.accountNumber.slice(-4),
      connected: true,
      is_default: true,
      account_holder_name: input.accountHolderName,
      sort_code: encryptSensitive(input.sortCode),
      account_number: encryptSensitive(input.accountNumber),
    })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return mapWithdrawMethod(data);
}

/**
 * Server-only: return the user's decrypted bank details for the hidden payout
 * integration. Never call this from anything that serialises to the client —
 * only the masked WithdrawMethod (last_digits) is safe for the UI.
 */
export async function getBankAccountForPayout(userId: string): Promise<{
  accountHolderName: string;
  sortCode: string;
  accountNumber: string;
} | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("withdraw_methods")
    .select("account_holder_name, sort_code, account_number")
    .eq("user_id", userId)
    .eq("provider", "bank_account")
    .maybeSingle();

  if (!data?.sort_code || !data?.account_number) {
    return null;
  }

  return {
    accountHolderName: data.account_holder_name ?? "",
    sortCode: decryptSensitive(data.sort_code),
    accountNumber: decryptSensitive(data.account_number),
  };
}

/** Remove the user's native ROVEXO bank account. */
export async function removeBankAccount(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("withdraw_methods")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "bank_account");

  return !error;
}

export async function recordWithdrawal(input: {
  userId: string;
  methodId: string;
  amount: number;
}): Promise<WalletTransaction | null> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const method = await getWithdrawMethodById(input.userId, input.methodId);
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", input.userId)
    .single();

  if (!method || !wallet || input.amount <= 0 || input.amount > Number(wallet.available_balance)) {
    return null;
  }

  const newBalance = Number(wallet.available_balance) - input.amount;

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
      order_number: `WD-${Date.now().toString().slice(-5)}`,
      product_title: `Withdrawal to ${method.label}`,
      amount: -input.amount,
      status: "completed",
      type: "withdrawal",
      withdraw_method_label: `${method.label} ••${method.lastDigits}`,
    })
    .select("*")
    .single();

  return transaction ? mapTransaction(transaction) : null;
}
