import "server-only";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Saved-row DB client keyed by an already-authenticated user id.
 * Prefers the existing service-role admin client so Bearer Native writes
 * persist without a cookie session. Does not create a new Auth client.
 * Does not decode JWTs. Cookie SSR is fallback only when admin is absent.
 */
export async function savedIdentityDb() {
  const admin = tryCreateAdminClient();
  if (admin) {
    return admin;
  }
  return createClient();
}
