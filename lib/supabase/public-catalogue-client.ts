import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

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
  if (admin) {
    return admin;
  }

  // Local/dev: a redacted inherited service-role key must not blank the marketplace.
  // Cookie-free anon client uses the same public RLS as listing detail pages.
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Public catalogue client unavailable: SUPABASE_SERVICE_ROLE_KEY is missing or unusable.",
    );
  }

  return createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
