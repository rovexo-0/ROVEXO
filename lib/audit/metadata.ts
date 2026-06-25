import type { Json } from "@/lib/supabase/types/database";

/** Values persisted in `platform_audit_logs.metadata` (Supabase jsonb). */
export type AuditLogMetadata = Json;

/** Coerce JSON-serializable action payloads into audit metadata. */
export function toAuditLogMetadata(
  value: AuditLogMetadata | Record<string, unknown> | undefined,
): AuditLogMetadata | undefined {
  if (value === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value)) as Json;
}
