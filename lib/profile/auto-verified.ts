import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileCompletionStatus } from "@/lib/account/profile-completion";

/** Syncs profiles.verified from automatic completion rules (no manual verification). */
export async function syncAutoVerifiedProfile(userId: string): Promise<void> {
  const status = await getProfileCompletionStatus(userId);
  const admin = createAdminClient();

  // Marketplace surfaces: seller passed publish gate (bank + published listing).
  const marketplaceFeedEligible =
    status.hasPublishedListing && status.hasBankAccount;

  await admin
    .from("profiles")
    .update({ verified: status.showVerifiedBadge || marketplaceFeedEligible })
    .eq("id", userId);
}
