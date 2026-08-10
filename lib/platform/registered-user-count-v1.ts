import "server-only";

import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import {
  REGISTERED_USER_COUNT_V1,
  formatRegisteredUserCount,
  isCountableRegisteredProfile,
  isCanonicalDemoAccountEmail,
  listCanonicalDemoExclusionEmails,
} from "@/lib/platform/registered-user-count-client-v1";

export {
  REGISTERED_USER_COUNT_V1,
  formatRegisteredUserCount,
  isCountableRegisteredProfile,
  isCanonicalDemoAccountEmail,
  listCanonicalDemoExclusionEmails,
};

export type RegisteredUserCountResult =
  | { ok: true; count: number }
  | { ok: false; reason: string };

/**
 * Single head-count against canonical profiles.
 * Excludes deleted + officially marked demo/test accounts.
 * Prefer service-role for reliability; fall back to RLS-public select.
 * Fail closed — never invent a number.
 */
export async function readRegisteredUserCount(): Promise<RegisteredUserCountResult> {
  const admin = tryCreateAdminClient();
  const client = admin ?? (await createClient());
  const demoEmails = listCanonicalDemoExclusionEmails();

  let query = client
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .neq("account_status", "deleted")
    /* Canonical demo domain — same marker as isProtectedDemoActor */
    .not("email", "ilike", `%@${REGISTERED_USER_COUNT_V1.demoEmailDomain}`)
    /* E2E / certification support+live-*@rovexo.co.uk — Owner counter protection */
    .not("email", "ilike", REGISTERED_USER_COUNT_V1.supportLiveTestPattern);

  if (demoEmails.length > 0) {
    /* Full Demo @rovexo.co.uk + exact DEMO_USERS allowlist (quoted for PostgREST) */
    const quoted = demoEmails.map((email) => `"${email.replace(/"/g, "")}"`).join(",");
    query = query.not("email", "in", `(${quoted})`);
  }

  const { count, error } = await query;

  if (error) {
    return { ok: false, reason: error.message };
  }
  if (count == null || !Number.isFinite(count) || count < 0) {
    return { ok: false, reason: "count_unavailable" };
  }

  return { ok: true, count: Math.floor(count) };
}
