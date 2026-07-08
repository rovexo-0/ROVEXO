import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Marks the seller profile as verified when their auth email is confirmed.
 * Uses the service role so the update succeeds (user JWT cannot set `verified`).
 */
export async function syncProfileVerifiedOnPublish(
  userId: string,
  emailConfirmedAt: string | null | undefined,
): Promise<void> {
  if (!emailConfirmedAt) return;

  const admin = createAdminClient();
  await admin.from("profiles").update({ verified: true }).eq("id", userId).eq("verified", false);
}
