import "server-only";

import { createShippingAdminClient } from "@/lib/shipping/db-client";
import type { FallbackEventInput } from "@/lib/shipping/providers/types";

type FallbackEventRow = {
  id: string;
  operation: string;
  reason: string;
  primary_provider: string;
  fallback_provider: string;
  order_id: string | null;
  parcel_id: string | null;
  error_message: string | null;
  created_at: string;
};

export async function logShippingFallbackEvent(input: FallbackEventInput): Promise<void> {
  console.warn(
    `[shipping/fallback] ${input.operation}: ${input.primaryProvider} → ${input.fallbackProvider} (${input.reason})`,
    input.errorMessage ?? "",
  );

  try {
    const admin = createShippingAdminClient();
    await admin.from("shipping_fallback_events").insert({
      operation: input.operation,
      reason: input.reason,
      primary_provider: input.primaryProvider,
      fallback_provider: input.fallbackProvider,
      order_id: input.orderId ?? null,
      parcel_id: input.parcelId ?? null,
      error_message: input.errorMessage ?? null,
    });
  } catch (error) {
    console.error("[shipping/fallback] Failed to persist fallback event:", error);
  }
}

export async function listRecentFallbackEvents(limit = 50): Promise<FallbackEventRow[]> {
  const admin = createShippingAdminClient();
  const { data } = await admin
    .from("shipping_fallback_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as FallbackEventRow[] | null) ?? [];
}

export function mapFallbackEventRow(row: FallbackEventRow) {
  return {
    id: row.id,
    operation: row.operation as FallbackEventInput["operation"],
    reason: row.reason as FallbackEventInput["reason"],
    primaryProvider: row.primary_provider as FallbackEventInput["primaryProvider"],
    fallbackProvider: row.fallback_provider as FallbackEventInput["fallbackProvider"],
    orderId: row.order_id,
    parcelId: row.parcel_id,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}
