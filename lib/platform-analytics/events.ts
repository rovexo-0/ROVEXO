import { createAdminClient } from "@/lib/supabase/admin";
import { toAuditLogMetadata, type AuditLogMetadata } from "@/lib/audit/metadata";
import type { Json } from "@/lib/supabase/types/database";

export type PlatformAnalyticsDomain =
  | "orders"
  | "promotions"
  | "trust"
  | "wholesale"
  | "monetization"
  | "search"
  | "help"
  | "ai";

export async function recordPlatformAnalyticsEvent(input: {
  domain: PlatformAnalyticsDomain;
  metric: string;
  value?: number;
  dimensions?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("platform_analytics_events").insert({
      domain: input.domain,
      metric: input.metric,
      value: input.value ?? 1,
      dimensions: (input.dimensions ?? {}) as Json,
    });
  } catch {
    // Analytics must never block primary flows.
  }
}

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: AuditLogMetadata | Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("platform_audit_logs").insert({
      actor_id: input.actorId ?? null,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      metadata: toAuditLogMetadata(input.metadata) ?? {},
    });
  } catch {
    // Audit logging must not block primary flows.
  }
}
