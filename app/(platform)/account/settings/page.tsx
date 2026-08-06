import { Suspense } from "react";
import { SettingsV1 } from "@/features/account-module/components/SettingsV1";
import { countAccountActiveListings } from "@/lib/account-center/profile-stats";
import { fetchCurrentProfile } from "@/lib/profile/repository";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Settings | ROVEXO",
  description: "Profile, security, privacy, and account preferences.",
};

/**
 * Settings hub is auth-protected by middleware.
 * Soft-load optional listing count — never FailClosed the menu on first paint.
 * Never call getProfile()/fetchProfile() here: redirect throws were caught as
 * null → loadFailed → Retry. Listing count is best-effort only.
 */
export default async function AccountSettingsRoute() {
  let activeListingCount = 0;
  try {
    const profile = await fetchCurrentProfile();
    if (profile) {
      activeListingCount = await countAccountActiveListings(profile.id).catch(() => 0);
    }
  } catch {
    activeListingCount = 0;
  }

  return (
    <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading settings…</div>}>
      <SettingsV1 activeListingCount={activeListingCount} />
    </Suspense>
  );
}
