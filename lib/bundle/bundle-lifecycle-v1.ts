/**
 * Bundle lifecycle status transitions.
 * active → offer_pending → checkout → paid (closed) | cancelled | expired | discarded
 */

import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { BundleCheckoutSnapshotV1 } from "@/lib/bundle/bundle-snapshot-v1";
import { bundleCheckoutLog } from "@/lib/bundle/bundle-checkout-log-v1";
import { appendBundleEvent } from "@/lib/bundle/bundle-events-v1";

function db() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function setBundleStatus(input: {
  bundleId: string;
  fromStatuses: string[];
  toStatus: string;
  actorId?: string | null;
  patch?: Record<string, unknown>;
  eventType: string;
  payload?: Record<string, unknown>;
}): Promise<boolean> {
  const admin = db();
  let query = admin
    .from("bundles")
    .update({
      status: input.toStatus,
      updated_at: new Date().toISOString(),
      ...(input.patch ?? {}),
    })
    .eq("id", input.bundleId);
  if (input.fromStatuses.length === 1) {
    query = query.eq("status", input.fromStatuses[0]!);
  } else if (input.fromStatuses.length > 1) {
    query = query.in("status", input.fromStatuses);
  }
  const { data, error } = await query.select("id");
  if (error || !data?.length) return false;
  await appendBundleEvent({
    bundleId: input.bundleId,
    actorId: input.actorId ?? null,
    eventType: input.eventType,
    payload: input.payload,
  });
  return true;
}

export async function markBundleOfferPending(input: {
  bundleId: string;
  buyerId: string;
  offerId: string;
}): Promise<boolean> {
  return setBundleStatus({
    bundleId: input.bundleId,
    fromStatuses: ["active"],
    toStatus: "offer_pending",
    actorId: input.buyerId,
    eventType: "bundle.offer_created",
    payload: { offerId: input.offerId },
  });
}

export async function restoreBundleToActive(input: {
  bundleId: string;
  actorId?: string | null;
  fromStatuses?: string[];
  reason?: string;
}): Promise<boolean> {
  const ok = await setBundleStatus({
    bundleId: input.bundleId,
    fromStatuses: input.fromStatuses ?? ["offer_pending", "checkout", "cancelled", "expired"],
    toStatus: "active",
    actorId: input.actorId ?? null,
    patch: { checkout_session_id: null, closed_at: null },
    eventType: "bundle.restored",
    payload: { reason: input.reason ?? "restore" },
  });
  return ok;
}

export async function restoreBundleAfterCheckoutCancel(
  snapshot: BundleCheckoutSnapshotV1,
): Promise<void> {
  const toStatus =
    snapshot.priorStatus === "offer_pending" && snapshot.offerId
      ? "offer_pending"
      : "active";
  await setBundleStatus({
    bundleId: snapshot.bundleId,
    fromStatuses: ["checkout"],
    toStatus,
    actorId: snapshot.buyerId,
    patch: { checkout_session_id: null },
    eventType: "bundle.restored",
    payload: {
      reason: "checkout_cancelled",
      restoredTo: toStatus,
      offerId: snapshot.offerId ?? null,
    },
  });
  bundleCheckoutLog("Checkout Cancelled", {
    bundleId: snapshot.bundleId,
    restoredTo: toStatus,
  });
}

export async function markBundlePaidAfterOrder(input: {
  bundleId: string;
  orderId: string;
  actorId?: string | null;
}): Promise<void> {
  const ok = await setBundleStatus({
    bundleId: input.bundleId,
    fromStatuses: ["checkout"],
    toStatus: "paid",
    actorId: input.actorId ?? null,
    patch: {
      order_id: input.orderId,
      closed_at: new Date().toISOString(),
    },
    eventType: "bundle.checkout_completed",
    payload: { orderId: input.orderId },
  });
  if (!ok) {
    // Idempotent: already paid / closed — skip duplicate events.
    const admin = db();
    const { data } = await admin
      .from("bundles")
      .select("status")
      .eq("id", input.bundleId)
      .maybeSingle();
    if (data?.status === "paid") {
      bundleCheckoutLog("Checkout Completed", input);
    }
    return;
  }
  await appendBundleEvent({
    bundleId: input.bundleId,
    actorId: input.actorId ?? null,
    eventType: "bundle.payment_confirmed",
    payload: { orderId: input.orderId },
  });
  await appendBundleEvent({
    bundleId: input.bundleId,
    actorId: input.actorId ?? null,
    eventType: "bundle.order_created",
    payload: { orderId: input.orderId },
  });
  await appendBundleEvent({
    bundleId: input.bundleId,
    actorId: input.actorId ?? null,
    eventType: "bundle.closed",
    payload: { orderId: input.orderId, status: "paid" },
  });
  bundleCheckoutLog("Checkout Completed", input);
  bundleCheckoutLog("Order Created", input);
}

export async function markBundleCancelled(input: {
  bundleId: string;
  actorId: string | null;
  reason?: string;
}): Promise<boolean> {
  return setBundleStatus({
    bundleId: input.bundleId,
    fromStatuses: ["active", "offer_pending", "checkout"],
    toStatus: "cancelled",
    actorId: input.actorId,
    patch: { closed_at: new Date().toISOString(), checkout_session_id: null },
    eventType: "bundle.cancelled",
    payload: { reason: input.reason ?? "cancelled" },
  });
}

export async function markBundleExpired(input: {
  bundleId: string;
  reason?: string;
}): Promise<boolean> {
  return setBundleStatus({
    bundleId: input.bundleId,
    fromStatuses: ["offer_pending", "checkout"],
    toStatus: "expired",
    actorId: null,
    patch: { closed_at: new Date().toISOString(), checkout_session_id: null },
    eventType: "bundle.expired",
    payload: { reason: input.reason ?? "expired" },
  });
}

/** Expire stale pending offers (>7d) and restore/expire linked bundles. */
export async function expireStaleBundleOffers(maxAgeHours = 168): Promise<number> {
  const admin = db();
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
  const { data: stale } = await admin
    .from("offers")
    .select("id, buyer_id, seller_id, message, status, created_at")
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .limit(100);

  let count = 0;
  const { parseBundleMessageMeta } = await import("@/lib/bundle/bundle-payload-v1");
  for (const offer of stale ?? []) {
    const { bundle } = parseBundleMessageMeta(offer.message);
    const { data: updated } = await admin
      .from("offers")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", offer.id)
      .eq("status", "pending")
      .select("id");
    if (!updated?.length) continue;
    count += 1;
    if (bundle?.bundleId) {
      await appendBundleEvent({
        bundleId: bundle.bundleId,
        actorId: null,
        eventType: "bundle.offer_expired",
        payload: { offerId: offer.id },
      });
      // Restore so buyer can continue shopping the same bundle.
      await restoreBundleToActive({
        bundleId: bundle.bundleId,
        fromStatuses: ["offer_pending"],
        reason: "offer_expired",
      });
    }
  }
  return count;
}
