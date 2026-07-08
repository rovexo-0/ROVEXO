import { createAdminClient } from "@/lib/supabase/admin";

export type ResolutionTable =
  | "resolution_rules"
  | "resolution_cases"
  | "resolution_events"
  | "carrier_claims"
  | "carrier_returns"
  | "carrier_responses"
  | "automation_logs";

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
  is: (column: string, value: null) => UntypedQuery;
  not: (column: string, operator: string, value: unknown) => UntypedQuery;
  gte: (column: string, value: unknown) => UntypedQuery;
  order: (column: string, options?: { ascending?: boolean }) => UntypedQuery;
  limit: (count: number) => UntypedQuery;
  maybeSingle: () => Promise<UntypedQueryResult>;
  single: () => Promise<UntypedQueryResult>;
};

/** Service-role client for Resolution Engine tables. */
export function createResolutionAdminClient(): { from: (table: ResolutionTable) => UntypedQuery } {
  const admin = createAdminClient();
  return admin as unknown as { from: (table: ResolutionTable) => UntypedQuery };
}
