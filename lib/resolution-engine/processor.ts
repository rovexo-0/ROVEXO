import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";
import { holdForClaim, releaseHoldForClaim } from "@/lib/commerce-engine";
import { createResolutionAdminClient } from "@/lib/resolution-engine/db-client";
import {
  getResolutionCase,
  openResolutionCase,
  updateResolutionCaseStatus,
} from "@/lib/resolution-engine/cases";
import {
  approveCarrierClaim,
  createCarrierReturn,
  loadOrderClaimContext,
  markReturnReceived,
  submitCarrierClaim,
} from "@/lib/resolution-engine/carrier-claims";
import { executeAutomaticRefund } from "@/lib/resolution-engine/refunds";
import { recordAutomationLog } from "@/lib/resolution-engine/audit";
import { notifyResolutionUpdate } from "@/lib/resolution-engine/notifications";
import type { ResolutionCaseRow } from "@/lib/resolution-engine/types";

const ACTIVE_STATUSES = ["OPEN", "PROCESSING", "WAITING_CARRIER", "WAITING_TRACKING", "WAITING_RETURN", "APPROVED"];

async function autoResolveProtectionCase(input: {
  protectionCaseId: string;
  orderId: string;
  outcome: "refund_full" | "return_accepted" | "seller_favour" | "no_action";
  notes: string;
  refundAmount?: number;
}): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("protection_cases")
    .update({
      status: "resolved",
      outcome: input.outcome,
      admin_notes: input.notes,
      refund_amount: input.refundAmount ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", input.protectionCaseId);

  await admin.from("protection_case_events").insert({
    case_id: input.protectionCaseId,
    actor_id: null,
    event_type: "auto_decision",
    message: input.notes,
    metadata: { outcome: input.outcome, automated: true } as Json,
  });

  if (input.outcome === "seller_favour" || input.outcome === "no_action") {
    await releaseHoldForClaim({ orderId: input.orderId });
  }
}

async function processLostOrDamagedCase(caseRow: ResolutionCaseRow): Promise<boolean> {
  await updateResolutionCaseStatus({ caseId: caseRow.id, status: "PROCESSING" });
  const ctx = await loadOrderClaimContext(caseRow.order_id);

  const claim = await submitCarrierClaim({
    orderId: caseRow.order_id,
    resolutionCaseId: caseRow.id,
    claimType: caseRow.case_type === "damaged" ? "damaged" : "lost",
    carrier: ctx.carrier,
    trackingNumber: ctx.trackingNumber,
    amountClaimed: ctx.amountClaimed,
    source: caseRow.trigger_event ?? "CRON_SYNC",
  });

  if (!claim) return false;

  await updateResolutionCaseStatus({ caseId: caseRow.id, status: "WAITING_CARRIER" });
  await approveCarrierClaim(claim.id, ctx.amountClaimed);
  await updateResolutionCaseStatus({ caseId: caseRow.id, status: "APPROVED", decision: "carrier_auto_approved" });

  const refund = await executeAutomaticRefund({
    orderId: caseRow.order_id,
    caseId: caseRow.id,
    ruleId: caseRow.rule_id ?? "lost_auto_refund",
    refundType: "full",
    amount: ctx.amountClaimed,
    reason: `automatic_${caseRow.case_type}`,
  });

  if (!refund.success) return false;

  if (caseRow.protection_case_id) {
    await autoResolveProtectionCase({
      protectionCaseId: caseRow.protection_case_id,
      orderId: caseRow.order_id,
      outcome: "refund_full",
      notes: "Automatically resolved — carrier claim approved.",
      refundAmount: ctx.amountClaimed,
    });
  }

  await notifyResolutionUpdate({
    orderId: caseRow.order_id,
    buyerId: caseRow.buyer_id,
    sellerId: caseRow.seller_id,
    status: "REFUNDED",
    message: "Your refund has been processed automatically.",
  });

  return true;
}

async function processReturnCase(caseRow: ResolutionCaseRow): Promise<boolean> {
  await updateResolutionCaseStatus({ caseId: caseRow.id, status: "PROCESSING" });
  const returnId = await createCarrierReturn({
    orderId: caseRow.order_id,
    resolutionCaseId: caseRow.id,
  });

  if (!returnId) return false;

  await updateResolutionCaseStatus({ caseId: caseRow.id, status: "WAITING_RETURN" });

  // Automated return: when return is requested, simulate received after rule (immediate for automation)
  await markReturnReceived(returnId);
  const ctx = await loadOrderClaimContext(caseRow.order_id);

  const refund = await executeAutomaticRefund({
    orderId: caseRow.order_id,
    caseId: caseRow.id,
    ruleId: caseRow.rule_id ?? "return_auto_refund",
    refundType: "full",
    amount: Number(ctx.order?.total ?? 0),
    reason: "automatic_return",
  });

  if (!refund.success) return false;

  if (caseRow.protection_case_id) {
    await autoResolveProtectionCase({
      protectionCaseId: caseRow.protection_case_id,
      orderId: caseRow.order_id,
      outcome: "return_accepted",
      notes: "Automatically resolved — return received.",
      refundAmount: Number(ctx.order?.total ?? 0),
    });
  }

  await notifyResolutionUpdate({
    orderId: caseRow.order_id,
    buyerId: caseRow.buyer_id,
    sellerId: caseRow.seller_id,
    status: "REFUNDED",
    message: "Return processed and refund issued automatically.",
  });

  return true;
}

async function processDeliveryCloseCase(caseRow: ResolutionCaseRow): Promise<boolean> {
  await updateResolutionCaseStatus({
    caseId: caseRow.id,
    status: "CLOSED",
    decision: "delivery_complete",
    resolvedAt: new Date().toISOString(),
  });
  await recordAutomationLog({
    orderId: caseRow.order_id,
    caseId: caseRow.id,
    action: "delivery_closed",
    ruleId: caseRow.rule_id ?? "delivery_auto_close",
    decision: "closed",
  });
  return true;
}

/** Process a single resolution case through the automated state machine. */
export async function processResolutionCase(caseId: string): Promise<boolean> {
  const caseRow = await getResolutionCase(caseId);
  if (!caseRow || !ACTIVE_STATUSES.includes(caseRow.status)) {
    return false;
  }

  switch (caseRow.case_type) {
    case "lost":
    case "damaged":
    case "failed_delivery":
    case "carrier_exception":
      return processLostOrDamagedCase(caseRow);
    case "return":
    case "dispute":
      return processReturnCase(caseRow);
    case "delivery":
    case "buyer_confirm":
    case "buyer_timeout":
      return processDeliveryCloseCase(caseRow);
    default:
      return false;
  }
}

/** Cron worker: process all open resolution cases automatically. */
export async function processPendingResolutionCases(limit = 50): Promise<number> {
  const admin = createResolutionAdminClient();
  const { data } = await admin
    .from("resolution_cases")
    .select("id")
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: true })
    .limit(limit);

  const rows = (data as Array<{ id: string }> | null) ?? [];
  let processed = 0;
  for (const row of rows) {
    const ok = await processResolutionCase(row.id);
    if (ok) processed += 1;
  }
  return processed;
}

/** Open + immediately queue processing for a carrier anomaly. */
export async function openAndProcessCarrierAnomaly(input: {
  orderId: string;
  caseType: "lost" | "damaged" | "failed_delivery" | "carrier_exception";
  triggerEvent: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await holdForClaim({
    orderId: input.orderId,
    reason: input.caseType,
    claimType: input.caseType,
  });

  const caseRow = await openResolutionCase({
    orderId: input.orderId,
    caseType: input.caseType,
    triggerEvent: input.triggerEvent as import("@/lib/resolution-engine/types").ResolutionTriggerEvent,
    metadata: input.metadata,
  });

  if (caseRow) {
    await processResolutionCase(caseRow.id);
  }
}
