import "server-only";

import { tryCreateAdminClient } from "@/lib/supabase/admin";

/**
 * Cookie-free Supabase client for PUBLIC marketplace catalogue SSR/ISR.
 *
 * Uses the service role (bypasses RLS). Callers MUST:
 * - Apply the same public filters as the marketplace (published, !is_demo, stock>0, …)
 * - Never select or serialize USER-SPECIFIC private data into a shared CDN document
 * - Never use this for account / wallet / orders / inbox / auth identity queries
 *
 * CLASS: PUBLIC catalogue only. Never enter USER-SPECIFIC responses.
 */
export function createPublicCatalogueClient() {
  const admin = tryCreateAdminClient();
  if (!admin) {
    throw new Error(
      "Public catalogue client unavailable: SUPABASE_SERVICE_ROLE_KEY is missing or unusable.",
    );
  }
  return admin;
}
