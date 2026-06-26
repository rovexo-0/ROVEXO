import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";
import type { MarketplaceAnalyticsSnapshot } from "@/lib/seller/marketplace/types";

export async function recordMarketplaceAnalyticsEvent(input: {
  sellerId: string;
  platform: MigrationPlatformId;
  eventType: string;
  durationMs?: number;
  errorCount?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("store_marketplace_connector_events").insert({
    seller_id: input.sellerId,
    platform: input.platform,
    event_type: input.eventType,
    duration_ms: input.durationMs ?? null,
    error_count: input.errorCount ?? 0,
    metadata: (input.metadata ?? {}) as Json,
  });
}

export async function getMarketplaceAnalyticsSnapshot(
  sellerId: string,
  platform?: MigrationPlatformId,
): Promise<MarketplaceAnalyticsSnapshot> {
  const admin = createAdminClient();
  let query = admin
    .from("store_marketplace_connector_events")
    .select("event_type, duration_ms, error_count, created_at")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (platform) {
    query = query.eq("platform", platform);
  }

  const { data } = await query;
  const events = data ?? [];
  const imports = events.filter((event) => event.event_type.includes("import")).length;
  const errors = events.reduce((sum, event) => sum + (event.error_count ?? 0), 0);
  const durations = events
    .map((event) => event.duration_ms)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const averageSyncMs =
    durations.length > 0
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0;

  return {
    imports,
    errors,
    averageSyncMs,
    lastImportAt: events[0]?.created_at ?? null,
  };
}
