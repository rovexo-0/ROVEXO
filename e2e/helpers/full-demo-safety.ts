import type { SupabaseClient } from "@supabase/supabase-js";
import { assertFullDemoNotDeletable } from "../../lib/full-demo/permanence";
import type { Database } from "../../lib/supabase/types/database";

/**
 * Hard-stop E2E teardown if a Full Demo Certification account is targeted.
 * Temp E2E users are always support+e2e-* emails; this is defense in depth.
 */
export async function assertE2eUserDeletable(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { data } = await admin.from("profiles").select("email").eq("id", userId).maybeSingle();
  assertFullDemoNotDeletable(data?.email, "delete in E2E teardown");
}
