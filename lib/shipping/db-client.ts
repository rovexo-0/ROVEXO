import { createAdminClient } from "@/lib/supabase/admin";

type ShippingTable =
  | "shipping_records"
  | "shipping_labels_v1"
  | "shipping_tracking_events"
  | "shipping_quotes"
  | "parcel2go_webhook_events"
  | "shipment_parcels";

type UntypedQueryResult = {
  data: unknown;
  error: { message: string } | null;
};

type UntypedQuery = PromiseLike<UntypedQueryResult> & {
  select: (columns?: string) => UntypedQuery;
  insert: (values: Record<string, unknown> | Record<string, unknown>[]) => UntypedQuery;
  update: (values: Record<string, unknown>) => UntypedQuery;
  delete: () => UntypedQuery;
  upsert: (
    values: Record<string, unknown>,
    options?: { onConflict?: string },
  ) => UntypedQuery;
  eq: (column: string, value: unknown) => UntypedQuery;
  not: (column: string, operator: string, value: unknown) => UntypedQuery;
  in: (column: string, values: unknown[]) => UntypedQuery;
  ilike: (column: string, pattern: string) => UntypedQuery;
  or: (filters: string) => UntypedQuery;
  order: (column: string, options?: { ascending?: boolean }) => UntypedQuery;
  limit: (count: number) => UntypedQuery;
  maybeSingle: () => Promise<UntypedQueryResult>;
  single: () => Promise<UntypedQueryResult>;
};

/** Admin client for shipping engine v1 tables until Supabase codegen includes the migration. */
export function createShippingAdminClient(): { from: (table: ShippingTable) => UntypedQuery } {
  const admin = createAdminClient();
  return admin as unknown as { from: (table: ShippingTable) => UntypedQuery };
}
