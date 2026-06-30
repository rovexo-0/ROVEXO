import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

function assertServiceRoleKey(serviceRoleKey: string): void {
  let anonKey: string | undefined;
  try {
    anonKey = getSupabaseAnonKey();
  } catch {
    anonKey = undefined;
  }

  if (anonKey && serviceRoleKey === anonKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is configured with the anon/publishable key. Use the Supabase service role secret.",
    );
  }
}

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS — never expose to the browser or authenticated user sessions.
 */
export function createServiceRoleClient() {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  assertServiceRoleKey(serviceRoleKey);

  return createClient<Database>(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** @alias createServiceRoleClient */
export function createAdminClient() {
  return createServiceRoleClient();
}
