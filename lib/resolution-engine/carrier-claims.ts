import { createAdminClient } from "@/lib/supabase/admin";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { createResolutionAdminClient } from "@/lib/resolution-engine/db-client";
import { recordAutomationLog, recordCarrierResponse } from "@/lib/resolution-engine/audit";
import type { CarrierClaimRow } from "@/lib/resolution-engine/types";

/**
 * Submit an internal carrier claim record.
 * Parcel2Go has no public claim API — this is ROVEXO ledger reconciliation only.
 */
export async function submitCarrierClaim(input: {
  orderId: string;
  resolutionCaseId: string;
  claimType: "lost" | "damaged" | "failed_delivery";
  carrier?: string | null;
  trackingNumber?: string | null;
  amountClaimed: number;
  source?: string;
}): Promise<CarrierClaimRow | null> {
  const admin = createResolutionAdminClient();
  const { data: existing } = await admin
    .from("carrier_claims")
    .select("*")
    .eq("order_id", input.orderId)
    .eq("claim_type", input.claimType)
    .in("status", ["submitted", "waiting", "approved"])
    .maybeSingle();

  if (existing) {
    return existing as CarrierClaimRow;
  }

  const reference = `ROVEXO-CLAIM-${input.orderId.slice(0, 8)}-${Date.now()}`;
  const { data, error } = await admin
    .from("carrier_claims")
    .insert({
      order_id: input.orderId,
      resolution_case_id: input.resolutionCaseId,
      carrier: input.carrier ?? null,
      tracking_number: input.trackingNumber ?? null,
      claim_type: input.claimType,
      status: "submitted",
      provider: "parcel2go",
      external_reference: reference,
      amount_claimed: input.amountClaimed,
      metadata: { automated: true },
    })
    .select("*")
    .single();

  if (error || !data) return null;

  await recordCarrierResponse({
    orderId: input.orderId,
    claimId: (data as CarrierClaimRow).id,
    source: input.source ?? "resolution_engine",
    responseType: "claim_submitted",
    payload: { reference, claimType: input.claimType },
  });

  await recordAutomationLog({
    orderId: input.orderId,
    caseId: input.resolutionCaseId,
    action: "carrier_claim_submitted",
    decision: "submitted",
    parcel2goResponse: { reference, note: "internal_ledger_only" },
  });

  return data as CarrierClaimRow;
}

/** Auto-approve an internal carrier claim (rule-based; no P2G API call). */
export async function approveCarrierClaim(claimId: string, amountApproved: number): Promise<void> {
  const admin = createResolutionAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("carrier_claims")
    .update({
      status: "approved",
      amount_approved: amountApproved,
      responded_at: now,
    })
    .eq("id", claimId);

  const { data } = await admin.from("carrier_claims").select("order_id, resolution_case_id").eq("id", claimId).maybeSingle();
  if (data) {
    const row = data as { order_id: string; resolution_case_id: string | null };
    await recordCarrierResponse({
      orderId: row.order_id,
      claimId,
      source: "resolution_engine",
      responseType: "claim_approved",
      payload: { amountApproved, automated: true },
    });
  }
}

export async function createCarrierReturn(input: {
  orderId: string;
  resolutionCaseId: string;
}): Promise<string | null> {
  const admin = createResolutionAdminClient();
  const { data: existing } = await admin
    .from("carrier_returns")
    .select("id")
    .eq("order_id", input.orderId)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;

  const { data } = await admin
    .from("carrier_returns")
    .insert({
      order_id: input.orderId,
      resolution_case_id: input.resolutionCaseId,
      status: "requested",
      metadata: { automated: true },
    })
    .select("id")
    .single();

  return (data as { id: string } | null)?.id ?? null;
}

export async function markReturnReceived(returnId: string): Promise<void> {
  const admin = createResolutionAdminClient();
  await admin.from("carrier_returns").update({ status: "received" }).eq("id", returnId);
}

export async function loadOrderClaimContext(orderId: string) {
  const core = createAdminClient();
  const shipping = createShippingAdminClient();
  const [{ data: order }, { data: shippingRow }] = await Promise.all([
    core.from("orders").select("id, total, item_price, delivery_fee, order_number").eq("id", orderId).maybeSingle(),
    shipping.from("shipping_records").select("carrier, tracking_number, status").eq("order_id", orderId).maybeSingle(),
  ]);
  return {
    order,
    shipping: shippingRow,
    amountClaimed: Number(order?.total ?? 0),
    carrier: (shippingRow as { carrier?: string } | null)?.carrier ?? null,
    trackingNumber: (shippingRow as { tracking_number?: string } | null)?.tracking_number ?? null,
  };
}
