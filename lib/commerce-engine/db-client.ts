import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Commerce Engine ledger tables (created in 20250729000001_commerce_engine_v1.sql).
 * These are not yet in Supabase codegen; this mirrors the established
 * createShippingAdminClient() pattern (lib/shipping/db-client.ts).
 */
export type CommerceTable =
  | "commerce_audit_logs"
  | "escrow_events"
  | "refund_events"
  | "shipping_reserve"
  | "shipping_transactions";

type UntypedQueryResult = {
  data: unknown;
  error: { message: string } | null;
};

type UntypedQuery = PromiseLike<UntypedQueryResult> & {
  select: (columns?: string) => UntypedQuery;
  insert: (values: Record<string, unknown> | Record<string, unknown>[]) => UntypedQuery;
  update: (values: Record<string, unknown>) => UntypedQuery;
  upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => UntypedQuery;
  eq: (column: string, value: unknown) => UntypedQuery;
  in: (column: string, values: unknown[]) => UntypedQuery;
  order: (column: string, options?: { ascending?: boolean }) => UntypedQuery;
  limit: (count: number) => UntypedQuery;
  maybeSingle: () => Promise<UntypedQueryResult>;
  single: () => Promise<UntypedQueryResult>;
};

/** Service-role admin client for Commerce Engine ledger tables. Bypasses RLS. */
export function createCommerceAdminClient(): { from: (table: CommerceTable) => UntypedQuery } {
  const admin = createAdminClient();
  return admin as unknown as { from: (table: CommerceTable) => UntypedQuery };
}
