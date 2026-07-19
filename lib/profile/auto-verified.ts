import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { getProfileCompletionStatus } from "@/lib/account/profile-completion";
import { isFullDemoEmail } from "@/lib/full-demo/canonical";

/** Syncs profiles.verified from automatic completion rules (no manual verification). */
export async function syncAutoVerifiedProfile(userId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    return;
  }

  const admin = createAdminClient();

  // Permanent Full Demo Accounts must always remain verified (certification contract).
  const { data: profile } = await admin
    .from("profiles")
    .select("email, verified")
    .eq("id", userId)
    .maybeSingle();

  if (isFullDemoEmail(profile?.email)) {
    if (profile?.verified !== true) {
      const { error } = await admin
        .from("profiles")
        .update({ verified: true, account_status: "active" })
        .eq("id", userId);
      if (error) {
        throw new Error(
          `Failed to restore Full Demo verified status for ${profile?.email}: ${error.message}`,
        );
      }
    }
    return;
  }

  const status = await getProfileCompletionStatus(userId);

  // Marketplace surfaces: seller passed publish gate (bank + published listing).
  const marketplaceFeedEligible =
    status.hasPublishedListing && status.hasBankAccount;

  await admin
    .from("profiles")
    .update({ verified: status.showVerifiedBadge || marketplaceFeedEligible })
    .eq("id", userId);
}
