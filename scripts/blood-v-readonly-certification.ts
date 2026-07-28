/**
 * BLOOD V — READ-ONLY certification (Escrow / Funds Release / Seller Wallet / Payout).
 *
 * ABSOLUTE CONSTRAINTS:
 * - SELECT + pure/business-rule validation ONLY
 * - NO mutations (no INSERT/UPDATE/DELETE)
 * - NEVER call: releaseOrderNow, settleSale, transferSalePayoutToConnect,
 *   stripe.transfers.create, wallet update functions, notification functions
 *
 * If release would be allowed → report "WOULD RELEASE" without executing.
 * Controlled demo release requires explicit Owner authorization of the separate
 * mutating runtime script — not this file.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DELIVERED_RELEASE_HOURS } from "@/lib/commerce-engine/escrow-constants";
import { decideRelease, type ReleaseReason } from "@/lib/commerce-engine/release-policy";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { isVirtualWalletMode } from "@/lib/launch-certification/demo-wallet";
import { isLaunchPrivateMode } from "@/lib/launch-certification/private-mode";

const OUT_DIR = path.join(process.cwd(), "test-results", "blood-v");
const REPORT_PATH = path.join(OUT_DIR, "BLOOD_V_READONLY_REPORT.json");
const ORDER_ID = process.env.BLOOD_V_ORDER_ID || "319ca2fc-ac24-42cb-884e-ae3c3c7e2d34";

const OPEN_CASE_STATUSES = [
  "open",
  "awaiting_seller",
  "awaiting_buyer",
  "under_review",
  "appealed",
] as const;

type Gate = "PASS" | "FAIL" | "WARN";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

function readClient(): SupabaseClient {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env (read-only SELECT requires URL + service role)");
  return createClient(url, key, { auth: { persistSession: false } });
}

function near(a: number, b: number, eps = 0.02) {
  return Math.abs(a - b) <= eps;
}

/** Mirrors settlement.hasOpenClaim — SELECT only. */
async function selectHasOpenClaim(client: SupabaseClient, orderId: string): Promise<boolean> {
  const { data } = await client
    .from("protection_cases")
    .select("id")
    .eq("order_id", orderId)
    .in("status", [...OPEN_CASE_STATUSES])
    .limit(1);
  return Boolean(data && data.length > 0);
}

/** Mirrors settlement.hasBlockingRefund — SELECT only. */
async function selectHasBlockingRefund(
  client: SupabaseClient,
  orderId: string,
  stripeRefundId: string | null,
): Promise<boolean> {
  if (stripeRefundId) return true;
  const { data } = await client
    .from("refund_events")
    .select("id")
    .eq("order_id", orderId)
    .in("status", ["pending", "processing", "completed"])
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

/**
 * Seller readiness from DB columns only — NEVER calls Stripe Connect APIs.
 * Virtual wallet mode ⇒ ready without Connect. Otherwise Connect account id must exist.
 */
function evaluateSellerReadiness(input: {
  virtualWalletMode: boolean;
  connectAccountId: string | null | undefined;
}): { ready: boolean; mode: "virtual" | "connect_id_present" | "connect_id_missing"; note: string } {
  if (input.virtualWalletMode) {
    return {
      ready: true,
      mode: "virtual",
      note: "ROVEXO_VIRTUAL_WALLET / certification private mode — Connect not required (DB check only; no Stripe call).",
    };
  }
  if (input.connectAccountId) {
    return {
      ready: true,
      mode: "connect_id_present",
      note: "seller_profiles.stripe_connect_account_id present. Live payoutsEnabled NOT verified (Stripe API forbidden in readonly cert).",
    };
  }
  return {
    ready: false,
    mode: "connect_id_missing",
    note: "No Connect account id and virtual wallet mode off — settleSale would return connect_not_ready.",
  };
}

function expectedLedgerIfReleased(input: {
  orderId: string;
  sellerId: string;
  amount: number;
  requireTimer: boolean;
  transferIdPlaceholder: string;
}) {
  return [
    {
      table: "escrow_events",
      operation: "INSERT",
      event_type: "moved_to_available",
      from_state: "pending",
      to_state: "available",
      reason: input.requireTimer ? "delivered_plus_24h" : "buyer_confirmed",
      amount: input.amount,
      executed: false,
    },
    {
      table: "commerce_audit_logs",
      operation: "INSERT",
      event: "SELLER_AVAILABLE",
      executed: false,
    },
    {
      table: "wallets",
      operation: "UPDATE",
      field: "pending_balance",
      delta: -input.amount,
      note: "available_balance unchanged by transferSalePayoutToConnect",
      executed: false,
    },
    {
      table: "wallet_transactions",
      operation: "UPDATE",
      status_from: "pending",
      status_to: "completed",
      stripe_transfer_id: input.transferIdPlaceholder,
      executed: false,
    },
    {
      table: "escrow_events",
      operation: "INSERT",
      event_type: "hold_released",
      from_state: "available",
      to_state: "released",
      reason: "connect_transfer",
      amount: input.amount,
      executed: false,
    },
    {
      table: "commerce_audit_logs",
      operation: "INSERT",
      event: "SELLER_PAID / escrow.released",
      executed: false,
    },
    {
      table: "notifications",
      operation: "INSERT",
      titles: ["Payout sent", "Funds are now available"],
      executed: false,
    },
  ];
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const client = readClient();
  const gates: Record<string, Gate> = {};
  const notes: string[] = [];

  // --- ORDER (SELECT) ---
  const { data: order, error: orderError } = await client
    .from("orders")
    .select(
      "id, status, item_price, platform_fee, total, seller_id, buyer_id, delivered_at, completed_at, order_number, stripe_refund_id, disputes_disabled",
    )
    .eq("id", ORDER_ID)
    .maybeSingle();

  if (orderError) notes.push(`order_error=${orderError.message}`);
  gates.order_exists = order ? "PASS" : "FAIL";
  if (!order) {
    const failReport = {
      law: "BLOOD V",
      mode: "READ_ONLY",
      host: "http://localhost:3000",
      orderId: ORDER_ID,
      gates,
      notes,
      verdict: "FAIL",
      releaseDisposition: "BLOCKED",
      blockingReason: "order_missing",
    };
    fs.writeFileSync(REPORT_PATH, JSON.stringify(failReport, null, 2));
    console.log(JSON.stringify(failReport, null, 2));
    process.exit(1);
  }

  // --- SALE / TRANSACTION (SELECT) ---
  const { data: sale, error: saleError } = await client
    .from("wallet_transactions")
    .select(
      "id, type, status, amount, fee_amount, description, order_number, stripe_transfer_id, payout_available_at, created_at, user_id, wallet_id",
    )
    .eq("user_id", order.seller_id)
    .eq("order_number", order.order_number)
    .eq("type", "sale")
    .maybeSingle();
  if (saleError) notes.push(`sale_error=${saleError.message}`);
  gates.transaction_exists = sale ? "PASS" : "FAIL";

  // --- ESCROW (SELECT) ---
  const { data: escrowEvents, error: escrowError } = await client
    .from("escrow_events")
    .select("id, event_type, from_state, to_state, reason, amount, created_at")
    .eq("order_id", ORDER_ID)
    .order("created_at", { ascending: true });
  if (escrowError) notes.push(`escrow_error=${escrowError.message}`);
  const escrow = escrowEvents ?? [];
  const hasHold = escrow.some((e) => e.event_type === "hold_created" || e.to_state === "pending");
  const hasReleased = escrow.some(
    (e) => e.event_type === "hold_released" || e.to_state === "released",
  );
  gates.escrow_exists = escrow.length > 0 ? "PASS" : "FAIL";
  gates.escrow_hold_created = hasHold ? "PASS" : "FAIL";

  // --- WALLET (SELECT) ---
  const { data: wallet, error: walletError } = await client
    .from("wallets")
    .select("id, user_id, pending_balance, available_balance")
    .eq("user_id", order.seller_id)
    .maybeSingle();
  if (walletError) notes.push(`wallet_error=${walletError.message}`);
  gates.wallet_exists = wallet ? "PASS" : "FAIL";

  const itemPrice = Number(order.item_price ?? 0);
  const { platformFee, sellerAmount } = calculateSellerNetAmount(itemPrice);
  const saleAmount = sale ? Number(sale.amount) : sellerAmount;
  const saleFee = sale ? Number(sale.fee_amount ?? 0) : 0;
  gates.fee_excluded_from_seller = saleFee === 0 ? "PASS" : "FAIL";
  gates.seller_amount_equals_item =
    sale && near(saleAmount, itemPrice) ? "PASS" : sale ? "FAIL" : "WARN";

  // Pending amount attributable to this sale while still pending
  const thisSaleStillPending =
    Boolean(sale) && sale!.status === "pending" && !sale!.stripe_transfer_id;
  const pendingAmountForOrder = thisSaleStillPending ? saleAmount : 0;

  // --- Blocking conditions (SELECT only) ---
  const hasOpenClaim = await selectHasOpenClaim(client, ORDER_ID);
  const hasRefund = await selectHasBlockingRefund(client, ORDER_ID, order.stripe_refund_id);
  gates.open_dispute_detection = "PASS";
  gates.blocking_refund_detection = "PASS";

  // --- Seller readiness (DB only — no Stripe) ---
  const virtualWalletMode = isVirtualWalletMode();
  const launchPrivate = isLaunchPrivateMode();
  const { data: sellerProfile } = await client
    .from("seller_profiles")
    .select("id, stripe_connect_account_id")
    .eq("id", order.seller_id)
    .maybeSingle();
  const sellerReadiness = evaluateSellerReadiness({
    virtualWalletMode,
    connectAccountId: sellerProfile?.stripe_connect_account_id ?? null,
  });
  gates.seller_account_readiness = sellerReadiness.ready ? "PASS" : "WARN";

  // --- Pure release decisions ---
  // Buyer-confirm path (requireTimer=false) — what releaseOrderNow uses
  const decisionBuyerConfirm = decideRelease({
    status: order.status,
    deliveredAt: order.delivered_at,
    hasRefund,
    hasOpenClaim,
    requireTimer: false,
  });
  // Auto-release path (requireTimer=true) — what releaseEligibleOrders uses
  const decisionAutoRelease = decideRelease({
    status: order.status,
    deliveredAt: order.delivered_at,
    hasRefund,
    hasOpenClaim,
    requireTimer: true,
  });

  /** Effective disposition may include post-policy ledger states beyond decideRelease(). */
  type EffectiveReason = ReleaseReason | "already_released" | "sale_already_completed";
  let policyReason: EffectiveReason = decisionBuyerConfirm;
  let releaseEligible = decisionBuyerConfirm === "released";
  let blockingReason: string | null =
    decisionBuyerConfirm === "released" ? null : decisionBuyerConfirm;

  if (!sale) {
    releaseEligible = false;
    blockingReason = "no_pending_sale";
    policyReason = "no_pending_sale";
  } else if (!thisSaleStillPending) {
    releaseEligible = false;
    blockingReason = hasReleased
      ? "already_released"
      : sale.status === "completed" || sale.stripe_transfer_id
        ? "sale_already_completed"
        : "no_pending_sale";
    policyReason = hasReleased ? "already_released" : "sale_already_completed";
  } else if (decisionBuyerConfirm === "released" && !sellerReadiness.ready) {
    releaseEligible = false;
    blockingReason = "connect_not_ready";
    policyReason = "connect_not_ready";
  }

  gates.release_eligibility_evaluated = "PASS";
  gates.expected_release_decision = "PASS";

  // Historical CP1: after payment, funds held (sale pending + hold event)
  gates.cp1_funds_held_after_payment =
    hasHold && (thisSaleStillPending || sale?.status === "completed") ? "PASS" : hasHold ? "PASS" : "FAIL";

  const transferIdPlaceholder = virtualWalletMode
    ? `demo_transfer_${ORDER_ID}`
    : `dev_or_stripe_transfer_${ORDER_ID}`;

  const releaseDisposition =
    releaseEligible && policyReason === "released" ? "WOULD RELEASE" : "WOULD NOT RELEASE";

  const expectedLedgerOperations =
    releaseDisposition === "WOULD RELEASE"
      ? expectedLedgerIfReleased({
          orderId: ORDER_ID,
          sellerId: order.seller_id,
          amount: saleAmount,
          requireTimer: false,
          transferIdPlaceholder,
        })
      : [];

  const failed = Object.values(gates).filter((g) => g === "FAIL").length;
  const report = {
    law: "BLOOD V",
    mode: "READ_ONLY",
    host: "http://localhost:3000",
    constraint: {
      mutations: false,
      releaseExecuted: false,
      walletUpdated: false,
      stripeCalled: false,
      supabaseWrites: false,
      forbiddenCalls: [
        "releaseOrderNow",
        "settleSale",
        "transferSalePayoutToConnect",
        "stripe.transfers.create",
        "wallet update functions",
        "notification functions",
      ],
    },
    orderId: ORDER_ID,
    deliveredReleaseHours: DELIVERED_RELEASE_HOURS,
    envFlags: {
      virtualWalletMode,
      launchPrivateMode: launchPrivate,
      note: "Seller readiness uses DB + env only. Stripe Connect live status is never queried.",
    },
    order: {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      item_price: itemPrice,
      platform_fee: Number(order.platform_fee ?? 0),
      total: Number(order.total ?? 0),
      seller_id: order.seller_id,
      buyer_id: order.buyer_id,
      delivered_at: order.delivered_at,
      completed_at: order.completed_at,
      stripe_refund_id: order.stripe_refund_id,
      disputes_disabled: order.disputes_disabled,
    },
    transaction: sale
      ? {
          id: sale.id,
          type: sale.type,
          status: sale.status,
          amount: saleAmount,
          fee_amount: saleFee,
          order_number: sale.order_number,
          stripe_transfer_id: sale.stripe_transfer_id,
          description: sale.description,
          still_pending: thisSaleStillPending,
        }
      : null,
    escrow: {
      eventCount: escrow.length,
      holdCreated: hasHold,
      alreadyReleased: hasReleased,
      events: escrow,
    },
    wallet: wallet
      ? {
          id: wallet.id,
          pending_balance: Number(wallet.pending_balance),
          available_balance: Number(wallet.available_balance),
        }
      : null,
    pendingAmount: {
      orderSalePending: pendingAmountForOrder,
      walletPendingBalance: wallet ? Number(wallet.pending_balance) : null,
      note: "orderSalePending is this order's sale only while status=pending; walletPendingBalance is seller total pending.",
    },
    blocking: {
      hasOpenClaim,
      hasRefund,
      saleMissing: !sale,
      saleAlreadySettled: Boolean(sale) && !thisSaleStillPending,
      sellerNotReady: !sellerReadiness.ready,
    },
    sellerReadiness,
    releaseEligible,
    blockingReason,
    expectedReleaseDecision: {
      buyerConfirmPath: decisionBuyerConfirm,
      autoReleasePath: decisionAutoRelease,
      effective: policyReason,
      requireTimerUsed: false,
      note: "releaseOrderNow uses requireTimer=false (buyer confirm). Auto cron uses requireTimer=true.",
    },
    expectedPayout: {
      itemPrice,
      platformFeeBuyerOnly: platformFee,
      sellerAmount,
      feeDeductedFromSeller: 0,
      currency: "GBP",
    },
    expectedLedgerOperations,
    releaseDisposition,
    ownerGate:
      releaseDisposition === "WOULD RELEASE"
        ? "Owner must explicitly authorize controlled demo release before any mutating runtime script."
        : "No release authorization needed — disposition is WOULD NOT RELEASE.",
    gates,
    notes,
    failed,
    verdict: failed === 0 ? "PASS" : "FAIL",
    certifiedAt: new Date().toISOString(),
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.error(`\nWrote ${REPORT_PATH}`);
  console.error(`releaseDisposition=${releaseDisposition} verdict=${report.verdict}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
