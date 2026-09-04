import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getConnectAccountStatus } from "@/lib/stripe/connect";
import { isStripeConfigured } from "@/lib/stripe/server";
import {
  assertWithdrawalRailReady,
  initiateWithdrawalPayout,
  reverseWithdrawalTransfer,
} from "@/lib/stripe/withdraw-payout";
import {
  isStripePayoutId,
  isStripeTransferId,
  reportLegacyPayoutIdInTransferColumn,
} from "@/lib/stripe/stripe-object-ids-v1";
import { mustUseVirtualWallet } from "@/lib/full-demo/security";
import { resolveBankAccountDisplayName } from "@/lib/wallet/bank-account";
import { decryptSensitive, encryptSensitive, isBankEncryptionConfigured } from "@/lib/wallet/crypto";
import { isWalletMoneyEnvReady } from "@/lib/wallet/env-validation";
import {
  buildWithdrawIdempotencyKey,
  canDebitAvailable,
  roundWalletMoney,
} from "@/lib/wallet/security";
import { WITHDRAW_DESC } from "@/lib/wallet/withdraw-lifecycle-v1";
import { assertRovexoVerifiedForMoney } from "@/lib/verified/money-gate";
import { logPaymentError } from "@/lib/ops/logger";
import type { Tables } from "@/lib/supabase/types/database";
import type {
  ConnectPayoutStatus,
  WalletData,
  WalletTransaction,
  WithdrawMethod,
} from "@/lib/wallet/types";
import { resolveCardImageSources } from "@/lib/media/product-image";
import { summarizeWalletWithdrawals } from "@/lib/transaction-hub/seller-wallet";
import {
  MIN_WITHDRAW_GBP,
  normalizeSellerContext,
  walletContextMatchesSellerContext,
  walletLedgerSellerContextFilter,
  type SellerContext,
} from "@/lib/seller-context/seller-context-v1";

/** Never select sort_code / account_number via the user session client. */
const WITHDRAW_METHOD_PUBLIC_COLUMNS =
  "id, user_id, provider, label, last_digits, connected, is_default, created_at, seller_context" as const;

function applySellerContextColumnFilter<
  T extends { eq: (column: string, value: string) => T; or: (filters: string) => T },
>(query: T, context: SellerContext): T {
  const filter = walletLedgerSellerContextFilter(context);
  return filter.mode === "eq"
    ? query.eq("seller_context", filter.value)
    : query.or(filter.value);
}

function mapTransaction(row: Tables<"wallet_transactions">): WalletTransaction {
  const legacy = reportLegacyPayoutIdInTransferColumn({
    transactionId: row.id,
    stripeTransferId: row.stripe_transfer_id,
  });
  if (legacy) {
    logPaymentError("Legacy payout id in stripe_transfer_id — reconciliation required", null, legacy);
  }

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
    stripePayoutId: row.stripe_payout_id ?? undefined,
  };
}

async function applyWalletListingImageFailClosed(
  transactions: WalletTransaction[],
): Promise<WalletTransaction[]> {
  if (transactions.length === 0) return transactions;

  const orderNumbers = [
    ...new Set(transactions.map((tx) => tx.orderNumber?.trim()).filter((value): value is string => Boolean(value))),
  ];

  const liveByOrderNumber = new Map<
    string,
    {
      status: string | null;
      storagePath: string | null;
      thumbnailUrl: string | null;
      url: string | null;
    }
  >();

  if (orderNumbers.length) {
    const admin = createAdminClient();
    const { data: orders } = await admin
      .from("orders")
      .select("order_number, order_items ( product_id )")
      .in("order_number", orderNumbers);

    const productIdByOrderNumber = new Map<string, string>();
    const productIds = new Set<string>();
    for (const order of orders ?? []) {
      const productId = (
        order.order_items as Array<{ product_id?: string }> | null
      )?.[0]?.product_id;
      if (!order.order_number || !productId) continue;
      productIdByOrderNumber.set(order.order_number, productId);
      productIds.add(productId);
    }

    if (productIds.size) {
      const { data: products } = await admin
        .from("products")
        .select(
          "id, status, product_images ( url, thumbnail_url, storage_path, is_primary, sort_order )",
        )
        .in("id", [...productIds]);

      const liveByProductId = new Map<
        string,
        {
          status: string | null;
          storagePath: string | null;
          thumbnailUrl: string | null;
          url: string | null;
        }
      >();
      for (const product of products ?? []) {
        const images = [
          ...((product.product_images as Array<{
            url: string;
            thumbnail_url?: string | null;
            storage_path?: string | null;
            is_primary: boolean;
            sort_order: number;
          }> | null) ?? []),
        ].sort(
          (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
        );
        const primary = images[0];
        liveByProductId.set(String(product.id), {
          status: product.status ?? null,
          storagePath: primary?.storage_path ?? null,
          thumbnailUrl: primary?.thumbnail_url ?? null,
          url: primary?.url ?? null,
        });
      }

      for (const [orderNumber, productId] of productIdByOrderNumber) {
        const live = liveByProductId.get(productId);
        if (live) liveByOrderNumber.set(orderNumber, live);
      }
    }
  }

  return transactions.map((tx) => {
    const live = tx.orderNumber ? liveByOrderNumber.get(tx.orderNumber) : undefined;
    const snapshot = tx.productImageUrl;
    if (!snapshot && !live) return tx;
    const resolved = resolveCardImageSources(live?.thumbnailUrl ?? snapshot, live?.url ?? snapshot);
    return { ...tx, productImageUrl: resolved.imageUrl };
  });
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

export async function getWalletData(
  userId: string,
  sellerContext: SellerContext = "individual",
): Promise<WalletData> {
  const context = normalizeSellerContext(sellerContext);
  const supabase = await createClient();
  let { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("wallet_context", context)
    .maybeSingle();

  if (!wallet && context === "individual") {
    const legacy = await supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle();
    if (
      legacy.data &&
      walletContextMatchesSellerContext(legacy.data.wallet_context, "individual")
    ) {
      wallet = legacy.data;
    }
  }

  const ledgerFilter = walletLedgerSellerContextFilter(context);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const monthQuery = supabase
    .from("wallet_transactions")
    .select("amount, type, status, stripe_transfer_id, seller_context")
    .eq("user_id", userId)
    .gte("created_at", monthStart);
  const txQuery = supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  const paidOutQuery = supabase
    .from("wallet_transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "withdrawal")
    .eq("status", "completed");
  const pendingSaleQuery = supabase
    .from("wallet_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "sale")
    .eq("status", "pending");
  const processingQuery = supabase
    .from("wallet_transactions")
    .select("amount, status")
    .eq("user_id", userId)
    .eq("type", "withdrawal")
    .eq("status", "pending");

  const scopedMonth =
    ledgerFilter.mode === "eq"
      ? monthQuery.eq("seller_context", ledgerFilter.value)
      : monthQuery.or(ledgerFilter.value);
  const scopedTx =
    ledgerFilter.mode === "eq"
      ? txQuery.eq("seller_context", ledgerFilter.value)
      : txQuery.or(ledgerFilter.value);
  const scopedPaidOut =
    ledgerFilter.mode === "eq"
      ? paidOutQuery.eq("seller_context", ledgerFilter.value)
      : paidOutQuery.or(ledgerFilter.value);
  const scopedPendingSale =
    ledgerFilter.mode === "eq"
      ? pendingSaleQuery.eq("seller_context", ledgerFilter.value)
      : pendingSaleQuery.or(ledgerFilter.value);
  const scopedProcessing =
    ledgerFilter.mode === "eq"
      ? processingQuery.eq("seller_context", ledgerFilter.value)
      : processingQuery.or(ledgerFilter.value);

  const [
    { data: monthTransactions },
    { data: transactions },
    { data: methods },
    { data: paidOutRows },
    connectStatus,
    { count: pendingOrderCount },
    { data: processingWithdrawalRows },
  ] = await Promise.all([
      scopedMonth,
      scopedTx,
      applySellerContextColumnFilter(
        supabase
          .from("withdraw_methods")
          .select(WITHDRAW_METHOD_PUBLIC_COLUMNS)
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        context,
      ),
      scopedPaidOut,
      getConnectAccountStatus(userId, context),
      scopedPendingSale,
      scopedProcessing,
  ]);

  const monthRevenue =
    monthTransactions
      ?.filter((tx) => tx.type === "sale")
      .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0;

  const monthPaidOut = Math.abs(
    monthTransactions
      ?.filter((tx) => tx.type === "withdrawal" && tx.status === "completed")
      .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0,
  );

  const monthWithdrawn = monthPaidOut;

  const paidOutBalance = Math.abs(
    paidOutRows?.reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0,
  );

  const mappedTransactions = await applyWalletListingImageFailClosed(
    (transactions ?? []).map(mapTransaction),
  );
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
    walletContext: context,
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
    withdrawMethods: overlayWithdrawMethodsForConnectStatus(
      (methods ?? []).map(mapWithdrawMethod),
      connectStatus,
    ),
    connectStatus,
  };
}

function overlayWithdrawMethodsForConnectStatus(
  methods: WithdrawMethod[],
  connectStatus: ConnectPayoutStatus,
): WithdrawMethod[] {
  const connected = Boolean(connectStatus.connected && connectStatus.payoutsEnabled);
  return methods.map((method) =>
    method.provider === "stripe_connect" ? { ...method, connected } : method,
  );
}

export async function listWalletTransactions(
  userId: string,
  sellerContext: SellerContext = "individual",
): Promise<WalletTransaction[]> {
  const context = normalizeSellerContext(sellerContext);
  const supabase = await createClient();
  const { data } = await applySellerContextColumnFilter(
    supabase.from("wallet_transactions").select("*").eq("user_id", userId),
    context,
  ).order("created_at", { ascending: false });

  return applyWalletListingImageFailClosed((data ?? []).map(mapTransaction));
}

export async function getWalletTransactionById(
  userId: string,
  id: string,
  sellerContext: SellerContext = "individual",
): Promise<WalletTransaction | null> {
  const context = normalizeSellerContext(sellerContext);
  const supabase = await createClient();
  const { data } = await applySellerContextColumnFilter(
    supabase.from("wallet_transactions").select("*").eq("user_id", userId).eq("id", id),
    context,
  ).maybeSingle();

  if (!data) return null;
  if (!walletContextMatchesSellerContext(data.seller_context, context)) {
    return null;
  }
  const [resolved] = await applyWalletListingImageFailClosed([mapTransaction(data)]);
  return resolved ?? null;
}

export async function listWithdrawMethods(
  userId: string,
  sellerContext: SellerContext = "individual",
): Promise<WithdrawMethod[]> {
  const context = normalizeSellerContext(sellerContext);
  const supabase = await createClient();
  const { data } = await applySellerContextColumnFilter(
    supabase
      .from("withdraw_methods")
      .select(WITHDRAW_METHOD_PUBLIC_COLUMNS)
      .eq("user_id", userId),
    context,
  ).order("created_at", { ascending: true });

  const methods = (data ?? []).map(mapWithdrawMethod);
  const connectStatus = await getConnectAccountStatus(userId, context);
  return overlayWithdrawMethodsForConnectStatus(methods, connectStatus);
}

export async function getWithdrawMethodById(
  userId: string,
  id: string,
  sellerContext: SellerContext = "individual",
): Promise<WithdrawMethod | null> {
  const context = normalizeSellerContext(sellerContext);
  const supabase = await createClient();
  const { data } = await applySellerContextColumnFilter(
    supabase
      .from("withdraw_methods")
      .select(WITHDRAW_METHOD_PUBLIC_COLUMNS)
      .eq("user_id", userId)
      .eq("id", id),
    context,
  ).maybeSingle();

  if (!data) return null;
  if (!walletContextMatchesSellerContext(data.seller_context, context)) {
    return null;
  }
  return mapWithdrawMethod(data);
}

/**
 * Save (replace) the user's native ROVEXO bank account. Fail-closed encryption.
 */
export async function saveBankAccount(input: {
  userId: string;
  accountHolderName: string;
  sortCode: string;
  accountNumber: string;
  sellerContext?: SellerContext | string | null;
}): Promise<WithdrawMethod | null> {
  if (!isWalletMoneyEnvReady("bank_encrypt") || !isBankEncryptionConfigured()) {
    return null;
  }

  const sellerContext = normalizeSellerContext(input.sellerContext);

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
    seller_context: sellerContext,
    account_holder_name: input.accountHolderName,
    sort_code: encryptedSort,
    account_number: encryptedAccount,
  };

  try {
    const admin = createAdminClient();
    const existingQuery = applySellerContextColumnFilter(
      admin
        .from("withdraw_methods")
        .select("id")
        .eq("user_id", input.userId)
        .eq("provider", "bank_account"),
      sellerContext,
    );
    const { data: existing } = await existingQuery
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

export type BankAccountDisplaySummary = {
  connected: boolean;
  displayName: string;
  lastDigits: string;
  sortCodeLast2: string | null;
};

/**
 * Public identification for the Bank Account modal.
 * Returns last-4 and sort last-2 only. Never returns full sort code or account number.
 */
export async function getBankAccountDisplaySummary(
  userId: string,
  sellerContext: SellerContext = "individual",
): Promise<BankAccountDisplaySummary | null> {
  const context = normalizeSellerContext(sellerContext);
  const methods = await listWithdrawMethods(userId, context);
  const method = methods.find((item) => item.provider === "bank_account" && item.connected);
  if (!method) {
    return null;
  }

  let sortCodeLast2: string | null = null;

  if (isBankEncryptionConfigured()) {
    try {
      const admin = createAdminClient();
      const { data } = await applySellerContextColumnFilter(
        admin
          .from("withdraw_methods")
          .select("sort_code")
          .eq("user_id", userId)
          .eq("provider", "bank_account"),
        context,
      ).maybeSingle();
      if (data?.sort_code) {
        const digits = decryptSensitive(data.sort_code).replace(/\D/g, "");
        if (digits.length >= 2) {
          sortCodeLast2 = digits.slice(-2);
        }
      }
    } catch {
      sortCodeLast2 = null;
    }
  }

  return {
    connected: true,
    displayName: resolveBankAccountDisplayName(method.label),
    lastDigits: method.lastDigits,
    sortCodeLast2,
  };
}

/**
 * Server-only: decrypted bank details for payout rails. Never serialize to client.
 */
export async function getBankAccountForPayout(
  userId: string,
  sellerContext: SellerContext = "individual",
): Promise<{
  accountHolderName: string;
  sortCode: string;
  accountNumber: string;
} | null> {
  if (!isBankEncryptionConfigured()) {
    return null;
  }

  const context = normalizeSellerContext(sellerContext);
  const admin = createAdminClient();
  const { data } = await applySellerContextColumnFilter(
    admin
      .from("withdraw_methods")
      .select("account_holder_name, sort_code, account_number")
      .eq("user_id", userId)
      .eq("provider", "bank_account"),
    context,
  ).maybeSingle();

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

/** Remove the user's native ROVEXO bank account for one seller context only. */
export async function removeBankAccount(
  userId: string,
  sellerContext: SellerContext = "individual",
): Promise<boolean> {
  const context = normalizeSellerContext(sellerContext);
  const admin = createAdminClient();
  const { error } = await applySellerContextColumnFilter(
    admin.from("withdraw_methods").delete().eq("user_id", userId).eq("provider", "bank_account"),
    context,
  );

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
  sellerContext?: string | null;
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

  const sellerContext = normalizeSellerContext(input.sellerContext);
  const amount = roundWalletMoney(input.amount);
  if (!(amount >= MIN_WITHDRAW_GBP)) {
    return null;
  }

  const admin = createAdminClient();
  const method = await getWithdrawMethodById(input.userId, input.methodId, sellerContext);
  if (!method || !method.connected) {
    return null;
  }

  if (method.provider === "bank_account") {
    if (!isBankEncryptionConfigured()) {
      return null;
    }
    const bank = await getBankAccountForPayout(input.userId, sellerContext);
    if (!bank?.sortCode || !bank.accountNumber) {
      return null;
    }
  }

  // Validate Connect / virtual rail BEFORE locking money.
  const rail = await assertWithdrawalRailReady(input.userId, method.provider, sellerContext);
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
    .select("id, available_balance, user_id, wallet_context")
    .eq("user_id", input.userId)
    .eq("wallet_context", sellerContext)
    .maybeSingle();

  let walletRow = wallet;

  // Legacy individual only — never accept a business row as individual fallback.
  if (!walletRow && sellerContext === "individual") {
    const legacy = await admin
      .from("wallets")
      .select("id, available_balance, user_id, wallet_context")
      .eq("user_id", input.userId)
      .maybeSingle();
    if (
      legacy.data &&
      walletContextMatchesSellerContext(legacy.data.wallet_context, "individual")
    ) {
      walletRow = legacy.data;
    }
  }

  if (
    !walletRow ||
    !walletContextMatchesSellerContext(walletRow.wallet_context, sellerContext) ||
    !canDebitAvailable(Number(walletRow.available_balance), amount)
  ) {
    return null;
  }

  const previousAvailable = roundWalletMoney(Number(walletRow.available_balance));
  const newBalance = roundWalletMoney(previousAvailable - amount);

  const { data: lockedRows, error: walletError } = await admin
    .from("wallets")
    .update({ available_balance: newBalance })
    .eq("id", walletRow.id)
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
      wallet_id: walletRow.id,
      user_id: input.userId,
      order_number: orderNumber,
      seller_context: sellerContext,
      product_title: `Withdrawal to ${method.label}`,
      amount: -amount,
      // WITHDRAWING / PROCESSING — never COMPLETED until transfer confirmation.
      status: "pending",
      type: "withdrawal",
      withdraw_method_label: `${method.label} ••${method.lastDigits}`,
      idempotency_key: idempotencyKey,
      description: WITHDRAW_DESC.withdrawing(idempotencyKey),
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
      .eq("id", walletRow.id)
      .eq("user_id", input.userId);

    return null;
  }

  const payout = await initiateWithdrawalPayout({
    userId: input.userId,
    transactionId: transaction.id,
    amount,
    methodProvider: method.provider,
    idempotencyKey,
    sellerContext,
  });

  if (!payout.success) {
    await rollbackWithdrawal({
      userId: input.userId,
      transactionId: transaction.id,
      reason: `payout_init_failed:${payout.error}`,
    });
    return null;
  }

  // Transfer success ≠ bank paid. Virtual has no bank rail → complete.
  // Live Express: keep pending + transfer id until payout.paid (or safe correlation).
  const settled = payout.virtual
    ? await confirmWithdrawalBankCompleted({
        userId: input.userId,
        transactionId: transaction.id,
        stripeTransferId: payout.transferId,
        virtual: true,
      })
    : await markWithdrawalTransferAwaitingPayout({
        userId: input.userId,
        transactionId: transaction.id,
        stripeTransferId: payout.transferId,
      });

  if (!settled) {
    await rollbackWithdrawal({
      userId: input.userId,
      transactionId: transaction.id,
      reason: "confirm_failed_after_transfer",
      stripeTransferId: payout.transferId,
    });
    return null;
  }

  const { data: finalRow } = await admin
    .from("wallet_transactions")
    .select("*")
    .eq("id", transaction.id)
    .maybeSingle();

  return finalRow ? mapTransaction(finalRow) : mapTransaction(transaction);
}

/**
 * After Connect Transfer succeeds: keep status pending (awaiting bank payout).
 * Never writes po_ into stripe_transfer_id. Never marks bank-paid.
 */
export async function markWithdrawalTransferAwaitingPayout(input: {
  userId: string;
  transactionId: string;
  stripeTransferId: string;
}): Promise<boolean> {
  if (!isStripeTransferId(input.stripeTransferId)) {
    logPaymentError(
      "Refused non-transfer id for stripe_transfer_id",
      null,
      { transactionId: input.transactionId, id: input.stripeTransferId },
    );
    return false;
  }

  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("wallet_transactions")
    .select("id, status, type, user_id, stripe_transfer_id")
    .eq("id", input.transactionId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!tx || tx.type !== "withdrawal" || tx.status !== "pending") {
    return false;
  }

  // Idempotent: already awaiting with same transfer id.
  if (tx.stripe_transfer_id === input.stripeTransferId) {
    return true;
  }

  const { data: updated, error } = await admin
    .from("wallet_transactions")
    .update({
      status: "pending",
      stripe_transfer_id: input.stripeTransferId,
      description: WITHDRAW_DESC.awaitingPayout(input.stripeTransferId),
    })
    .eq("id", input.transactionId)
    .eq("user_id", input.userId)
    .eq("status", "pending")
    .eq("type", "withdrawal")
    .select("id");

  return Boolean(!error && updated?.length);
}

/**
 * Confirm bank settlement (payout.paid) or virtual withdraw completion.
 * Stores stripe_payout_id separately. Never overwrites stripe_transfer_id with po_.
 */
export async function confirmWithdrawalBankCompleted(input: {
  userId: string;
  transactionId: string;
  stripePayoutId?: string | null;
  stripeTransferId?: string | null;
  virtual?: boolean;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("wallet_transactions")
    .select("id, status, type, user_id, stripe_transfer_id, stripe_payout_id")
    .eq("id", input.transactionId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!tx || tx.type !== "withdrawal") {
    return false;
  }

  // Idempotent completed.
  if (tx.status === "completed") {
    if (
      input.stripePayoutId &&
      isStripePayoutId(input.stripePayoutId) &&
      !tx.stripe_payout_id
    ) {
      await admin
        .from("wallet_transactions")
        .update({ stripe_payout_id: input.stripePayoutId })
        .eq("id", input.transactionId)
        .eq("user_id", input.userId);
    }
    return true;
  }

  if (tx.status !== "pending") {
    return false;
  }

  // Never write payout id into transfer column.
  if (input.stripeTransferId && isStripePayoutId(input.stripeTransferId)) {
    logPaymentError(
      "Refused writing payout id into stripe_transfer_id",
      null,
      { transactionId: input.transactionId, id: input.stripeTransferId },
    );
  }

  let patch: {
    status: "completed";
    description: string;
    stripe_transfer_id?: string;
    stripe_payout_id?: string;
  };

  if (input.virtual) {
    patch = {
      status: "completed",
      description: WITHDRAW_DESC.completedVirtual(input.transactionId),
    };
    if (input.stripeTransferId && isStripeTransferId(input.stripeTransferId)) {
      patch.stripe_transfer_id = input.stripeTransferId;
    }
  } else if (input.stripePayoutId && isStripePayoutId(input.stripePayoutId)) {
    patch = {
      status: "completed",
      stripe_payout_id: input.stripePayoutId,
      description: WITHDRAW_DESC.completedBank(input.stripePayoutId),
    };
  } else {
    return false;
  }

  const { data: updated, error } = await admin
    .from("wallet_transactions")
    .update(patch)
    .eq("id", input.transactionId)
    .eq("user_id", input.userId)
    .eq("status", "pending")
    .eq("type", "withdrawal")
    .select("id");

  return Boolean(!error && updated?.length);
}

/**
 * @deprecated Prefer confirmWithdrawalBankCompleted / markWithdrawalTransferAwaitingPayout.
 * Kept for callers that mean bank completion; refuses po_ in transfer column.
 */
export async function confirmWithdrawalCompleted(input: {
  userId: string;
  transactionId: string;
  stripeTransferId?: string | null;
  stripePayoutId?: string | null;
}): Promise<boolean> {
  if (input.stripePayoutId || isStripePayoutId(input.stripeTransferId)) {
    return confirmWithdrawalBankCompleted({
      userId: input.userId,
      transactionId: input.transactionId,
      stripePayoutId: input.stripePayoutId ?? input.stripeTransferId,
    });
  }
  if (input.stripeTransferId && isStripeTransferId(input.stripeTransferId)) {
    return markWithdrawalTransferAwaitingPayout({
      userId: input.userId,
      transactionId: input.transactionId,
      stripeTransferId: input.stripeTransferId,
    });
  }
  return false;
}

/**
 * Express automatic payout failed after Transfer.
 * Do NOT restore Available (funds may still sit on Connect).
 * Do NOT reverse Transfer blindly.
 * Persist stripe_payout_id + failure description; keep pending for recoverability.
 */
export async function markWithdrawalPayoutFailed(input: {
  userId: string;
  transactionId: string;
  stripePayoutId: string;
  failureCode?: string | null;
}): Promise<boolean> {
  if (!isStripePayoutId(input.stripePayoutId)) {
    return false;
  }

  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("wallet_transactions")
    .select("id, status, type, user_id, stripe_transfer_id")
    .eq("id", input.transactionId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!tx || tx.type !== "withdrawal") {
    return false;
  }

  // Already bank-completed — never invent Available credit or reverse.
  if (tx.status === "completed") {
    logPaymentError(
      "payout.failed after completed withdrawal — ops review required",
      null,
      {
        transactionId: input.transactionId,
        payoutId: input.stripePayoutId,
      },
    );
    return false;
  }

  if (tx.status !== "pending") {
    return false;
  }

  const code = input.failureCode ?? "unknown";
  const { data: updated, error } = await admin
    .from("wallet_transactions")
    .update({
      stripe_payout_id: input.stripePayoutId,
      description: WITHDRAW_DESC.payoutFailed(input.stripePayoutId, code),
      // Stay pending + transfer_id: Available already debited; funds on Connect.
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
      description: WITHDRAW_DESC.rolledBack(input.reason),
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
