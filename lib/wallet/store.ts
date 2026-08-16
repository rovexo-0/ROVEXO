import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getConnectAccountStatus } from "@/lib/stripe/connect";
import { isStripeConfigured } from "@/lib/stripe/server";
import {
  assertWithdrawalRailReady,
  initiateWithdrawalPayout,
  reverseWithdrawalTransfer,
} from "@/lib/stripe/withdraw-payout";
import { mustUseVirtualWallet } from "@/lib/full-demo/security";
import { decryptSensitive, encryptSensitive, isBankEncryptionConfigured } from "@/lib/wallet/crypto";
import { isWalletMoneyEnvReady } from "@/lib/wallet/env-validation";
import {
  buildWithdrawIdempotencyKey,
  canDebitAvailable,
  roundWalletMoney,
} from "@/lib/wallet/security";
import { assertRovexoVerifiedForMoney } from "@/lib/verified/money-gate";
import type { Tables } from "@/lib/supabase/types/database";
import type { WalletData, WalletTransaction, WithdrawMethod } from "@/lib/wallet/types";
import { summarizeWalletWithdrawals } from "@/lib/transaction-hub/seller-wallet";

/** Never select sort_code / account_number via the user session client. */
const WITHDRAW_METHOD_PUBLIC_COLUMNS =
  "id, user_id, provider, label, last_digits, connected, is_default, created_at" as const;

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

function mapWithdrawMethod(row: {
  id: string;
  provider: string;
  label: string;
  last_digits: string;
  connected: boolean;
}): WithdrawMethod {
  return {
    id: row.id,
    provider: row.provider as WithdrawMethod["provider"],
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

  const [
    { data: monthTransactions },
    { data: transactions },
    { data: methods },
    { data: paidOutRows },
    connectStatus,
    { count: pendingOrderCount },
    { data: processingWithdrawalRows },
  ] = await Promise.all([
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
        .select(WITHDRAW_METHOD_PUBLIC_COLUMNS)
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
      supabase
        .from("wallet_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("type", "sale")
        .eq("status", "pending"),
      supabase
        .from("wallet_transactions")
        .select("amount, status")
        .eq("user_id", userId)
        .eq("type", "withdrawal")
        .eq("status", "pending"),
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
      ?.filter((tx) => tx.type === "withdrawal" && tx.status === "completed")
      .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0,
  );

  const paidOutBalance =
    paidOutRows?.reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0;

  const mappedTransactions = (transactions ?? []).map(mapTransaction);
  const withdrawalSummaryFromList = summarizeWalletWithdrawals(mappedTransactions);
  const processingTotal = roundWalletMoney(
    (processingWithdrawalRows ?? []).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0),
  );
  const processingCount = processingWithdrawalRows?.length ?? 0;
  const withdrawalSummary = {
    processingTotal,
    processingCount,
    completedTotal: withdrawalSummaryFromList.completedTotal,
    completedCount: withdrawalSummaryFromList.completedCount,
  };

  const monthFees = Math.abs(
    monthTransactions
      ?.filter((tx) => tx.type === "fee")
      .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0,
  );

  return {
    availableBalance: Number(wallet?.available_balance ?? 0),
    pendingBalance: Number(wallet?.pending_balance ?? 0),
    pendingAvailableAt: wallet?.pending_available_at ?? "",
    lockedBalance: Number(wallet?.locked_balance ?? 0),
    paidOutBalance,
    pendingOrderCount: pendingOrderCount ?? 0,
    withdrawalSummary,
    monthSummary: {
      revenue: { value: monthRevenue, changePercent: 0 },
      withdrawn: { value: monthPaidOut + monthWithdrawn, changePercent: 0 },
      fees: { value: monthFees, changePercent: 0 },
    },
    transactions: mappedTransactions,
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
    .select(WITHDRAW_METHOD_PUBLIC_COLUMNS)
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
    .select(WITHDRAW_METHOD_PUBLIC_COLUMNS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  return data ? mapWithdrawMethod(data) : null;
}

/**
 * Save (replace) the user's native ROVEXO bank account. Fail-closed encryption.
 */
export async function saveBankAccount(input: {
  userId: string;
  accountHolderName: string;
  sortCode: string;
  accountNumber: string;
}): Promise<WithdrawMethod | null> {
  if (!isWalletMoneyEnvReady("bank_encrypt") || !isBankEncryptionConfigured()) {
    return null;
  }

  let encryptedSort: string;
  let encryptedAccount: string;
  try {
    encryptedSort = encryptSensitive(input.sortCode);
    encryptedAccount = encryptSensitive(input.accountNumber);
  } catch {
    return null;
  }

  const lastDigits = input.accountNumber.slice(-4);
  const payload = {
    provider: "bank_account" as const,
    label: "Bank account",
    last_digits: lastDigits,
    connected: true,
    is_default: true,
    account_holder_name: input.accountHolderName,
    sort_code: encryptedSort,
    account_number: encryptedAccount,
  };

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("withdraw_methods")
      .select("id")
      .eq("user_id", input.userId)
      .eq("provider", "bank_account")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const query = existing
      ? admin
          .from("withdraw_methods")
          .update(payload)
          .eq("id", existing.id)
          .eq("user_id", input.userId)
      : admin.from("withdraw_methods").insert({
          user_id: input.userId,
          ...payload,
        });

    const { data, error } = await query.select(WITHDRAW_METHOD_PUBLIC_COLUMNS).single();

    if (error || !data) {
      return null;
    }

    return mapWithdrawMethod(data);
  } catch {
    return null;
  }
}

/**
 * Server-only: decrypted bank details for payout rails. Never serialize to client.
 */
export async function getBankAccountForPayout(userId: string): Promise<{
  accountHolderName: string;
  sortCode: string;
  accountNumber: string;
} | null> {
  if (!isBankEncryptionConfigured()) {
    return null;
  }

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

  try {
    return {
      accountHolderName: data.account_holder_name ?? "",
      sortCode: decryptSensitive(data.sort_code),
      accountNumber: decryptSensitive(data.account_number),
    };
  } catch {
    return null;
  }
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

/**
 * Wallet Security Certification v1.0 — withdraw request.
 *
 * validate rail → idempotent return → atomic conditional debit → pending ledger
 * → Stripe/virtual transfer → confirm OR rollback.
 * Never marks completed without transfer confirmation.
 */
export async function recordWithdrawal(input: {
  userId: string;
  methodId: string;
  amount: number;
  idempotencyKey?: string | null;
}): Promise<WalletTransaction | null> {
  // Fail closed: never lock or move money when required secrets are missing.
  if (!isWalletMoneyEnvReady("withdraw")) {
    return null;
  }

  // Fail closed: ROVEXO Verified Engine — no money without verification / KYC / data match.
  const verifiedGate = await assertRovexoVerifiedForMoney(input.userId);
  if (!verifiedGate.allowed) {
    return null;
  }

  const virtual = mustUseVirtualWallet();
  // Fail closed: real withdraws need Stripe; bank method needs encryption.
  if (!virtual && !isStripeConfigured()) {
    return null;
  }

  const amount = roundWalletMoney(input.amount);
  if (!(amount > 0)) {
    return null;
  }

  const admin = createAdminClient();
  const method = await getWithdrawMethodById(input.userId, input.methodId);
  if (!method || !method.connected) {
    return null;
  }

  if (method.provider === "bank_account") {
    if (!isBankEncryptionConfigured()) {
      return null;
    }
    const bank = await getBankAccountForPayout(input.userId);
    if (!bank?.sortCode || !bank.accountNumber) {
      return null;
    }
  }

  // Validate Connect / virtual rail BEFORE locking money.
  const rail = await assertWithdrawalRailReady(input.userId, method.provider);
  if (!rail.ready) {
    return null;
  }

  const idempotencyKey = buildWithdrawIdempotencyKey({
    userId: input.userId,
    methodId: input.methodId,
    amount,
    clientKey: input.idempotencyKey,
  });

  const { data: existing } = await admin
    .from("wallet_transactions")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    return mapTransaction(existing);
  }

  const { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance, user_id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!wallet || !canDebitAvailable(Number(wallet.available_balance), amount)) {
    return null;
  }

  const previousAvailable = roundWalletMoney(Number(wallet.available_balance));
  const newBalance = roundWalletMoney(previousAvailable - amount);

  const { data: lockedRows, error: walletError } = await admin
    .from("wallets")
    .update({ available_balance: newBalance })
    .eq("id", wallet.id)
    .eq("user_id", input.userId)
    .gte("available_balance", amount)
    .select("id");

  if (walletError || !lockedRows?.length) {
    return null;
  }

  const orderNumber = `WD-${Date.now().toString().slice(-8)}`;
  const { data: transaction, error: txError } = await admin
    .from("wallet_transactions")
    .insert({
      wallet_id: wallet.id,
      user_id: input.userId,
      order_number: orderNumber,
      product_title: `Withdrawal to ${method.label}`,
      amount: -amount,
      // WITHDRAWING / PROCESSING — never COMPLETED until transfer confirmation.
      status: "pending",
      type: "withdrawal",
      withdraw_method_label: `${method.label} ••${method.lastDigits}`,
      idempotency_key: idempotencyKey,
      description: `withdrawing:${idempotencyKey}`,
    })
    .select("*")
    .single();

  if (txError || !transaction) {
    if (txError?.code === "23505") {
      const { data: raced } = await admin
        .from("wallet_transactions")
        .select("*")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (raced) return mapTransaction(raced);
    }

    await admin
      .from("wallets")
      .update({ available_balance: previousAvailable })
      .eq("id", wallet.id)
      .eq("user_id", input.userId);

    return null;
  }

  const payout = await initiateWithdrawalPayout({
    userId: input.userId,
    transactionId: transaction.id,
    amount,
    methodProvider: method.provider,
    idempotencyKey,
  });

  if (!payout.success) {
    await rollbackWithdrawal({
      userId: input.userId,
      transactionId: transaction.id,
      reason: `payout_init_failed:${payout.error}`,
    });
    return null;
  }

  // Transfer confirmation = money left platform ledger to Connect (or virtual rail).
  const confirmed = await confirmWithdrawalCompleted({
    userId: input.userId,
    transactionId: transaction.id,
    stripeTransferId: payout.transferId,
  });

  if (!confirmed) {
    // Uncertain ledger confirm → reverse transfer then unlock (never leave orphan debit).
    await rollbackWithdrawal({
      userId: input.userId,
      transactionId: transaction.id,
      reason: "confirm_failed_after_transfer",
      stripeTransferId: payout.transferId,
    });
    return null;
  }

  const { data: completed } = await admin
    .from("wallet_transactions")
    .select("*")
    .eq("id", transaction.id)
    .maybeSingle();

  return completed ? mapTransaction(completed) : mapTransaction(transaction);
}

/**
 * Confirm a pending withdrawal after external payout success (audit + COMPLETED).
 * Fail closed if row is not a pending withdrawal owned by the user.
 */
export async function confirmWithdrawalCompleted(input: {
  userId: string;
  transactionId: string;
  stripeTransferId?: string | null;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("wallet_transactions")
    .select("id, status, type, user_id")
    .eq("id", input.transactionId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!tx || tx.type !== "withdrawal" || tx.status !== "pending") {
    return false;
  }

  const { data: updated, error } = await admin
    .from("wallet_transactions")
    .update({
      status: "completed",
      ...(input.stripeTransferId ? { stripe_transfer_id: input.stripeTransferId } : {}),
      description: `completed:${input.transactionId}`,
    })
    .eq("id", input.transactionId)
    .eq("user_id", input.userId)
    .eq("status", "pending")
    .eq("type", "withdrawal")
    .select("id");

  return Boolean(!error && updated?.length);
}

/**
 * Roll back a pending withdrawal — reverse Stripe transfer if needed,
 * restore Available, mark FAILED / ROLLED BACK.
 * Never restores Available while a live Connect transfer still holds funds.
 */
export async function rollbackWithdrawal(input: {
  userId: string;
  transactionId: string;
  reason: string;
  stripeTransferId?: string | null;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("wallet_transactions")
    .select("id, status, type, user_id, amount, wallet_id, stripe_transfer_id, idempotency_key")
    .eq("id", input.transactionId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!tx || tx.type !== "withdrawal" || tx.status !== "pending") {
    return false;
  }

  const restore = roundWalletMoney(Math.abs(Number(tx.amount)));
  const transferId = input.stripeTransferId ?? tx.stripe_transfer_id ?? null;

  if (transferId) {
    const reversed = await reverseWithdrawalTransfer({
      transferId,
      amount: restore,
      idempotencyKey: tx.idempotency_key ?? input.transactionId,
    });
    if (!reversed.success) {
      // Uncertainty: money may still be on Connect — do not invent Available credit.
      return false;
    }
  }

  const { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance")
    .eq("id", tx.wallet_id)
    .maybeSingle();

  if (!wallet) return false;

  const { data: unlocked, error: unlockError } = await admin
    .from("wallets")
    .update({
      available_balance: roundWalletMoney(Number(wallet.available_balance) + restore),
    })
    .eq("id", wallet.id)
    .select("id");

  if (unlockError || !unlocked?.length) {
    return false;
  }

  const { error } = await admin
    .from("wallet_transactions")
    .update({
      status: "failed",
      description: `rolled_back:${input.reason}`,
    })
    .eq("id", input.transactionId)
    .eq("status", "pending");

  if (error) {
    // Attempt re-lock if status update failed (best-effort recoverability).
    await admin
      .from("wallets")
      .update({ available_balance: roundWalletMoney(Number(wallet.available_balance)) })
      .eq("id", wallet.id);
    return false;
  }

  return true;
}
