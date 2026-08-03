/**
 * Bundle Engine v1.0 — event append helper (server only).
 * Every lifecycle transition must append an event with actor + payload.
 */

import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

export const BUNDLE_EVENT_TYPES = [
  "bundle.created",
  "bundle.item_added",
  "bundle.item_removed",
  "bundle.item_qty",
  "bundle.discarded",
  "bundle.offer_created",
  "bundle.offer_countered",
  "bundle.offer_accepted",
  "bundle.offer_declined",
  "bundle.offer_cancelled",
  "bundle.offer_expired",
  "bundle.checkout_started",
  "bundle.checkout_completed",
  "bundle.payment_confirmed",
  "bundle.order_created",
  "bundle.closed",
  "bundle.restored",
  "bundle.cancelled",
  "bundle.expired",
] as const;

export type BundleEventTypeV1 = (typeof BUNDLE_EVENT_TYPES)[number];

export async function appendBundleEvent(input: {
  bundleId: string;
  actorId: string | null;
  eventType: BundleEventTypeV1 | string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const db = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await db.from("bundle_events").insert({
    bundle_id: input.bundleId,
    actor_id: input.actorId,
    event_type: input.eventType,
    payload: input.payload ?? {},
  });
  if (error) {
    console.error("[bundle_events] append failed", {
      bundleId: input.bundleId,
      eventType: input.eventType,
      message: error.message,
    });
  }
}
