import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/env";

/** Real Supabase secrets are JWTs. Truncated/redacted local inheritances are not. */
function looksLikeJwtSecret(value: string): boolean {
  const parts = value.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 8);
}

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
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      "Supabase admin client unavailable: SUPABASE_SERVICE_ROLE_KEY is missing or unusable.",
    );
  }

  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!looksLikeJwtSecret(serviceRoleKey)) {
    throw new Error(
      "Supabase admin client unavailable: SUPABASE_SERVICE_ROLE_KEY is missing or unusable.",
    );
  }
  assertServiceRoleKey(serviceRoleKey);

  return createClient<Database>(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Soft factory for consumer paths — returns null when admin secrets are absent. */
export function tryCreateAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

/** @alias createServiceRoleClient */
export function createAdminClient() {
  return createServiceRoleClient();
}
