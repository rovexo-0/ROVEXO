import { Suspense } from "react";
import { SettingsV1 } from "@/features/account-module/components/SettingsV1";
import { countAccountActiveListings } from "@/lib/account-center/profile-stats";
import { fetchProfile } from "@/lib/profile/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Settings | ROVEXO",
  description: "Profile, security, privacy, and account preferences.",
};

export default async function AccountSettingsRoute() {
  const profile = await fetchProfile().catch(() => null);
  const activeListingCount = profile
    ? await countAccountActiveListings(profile.id).catch(() => 0)
    : 0;

  return (
    <Suspense fallback={<div className="p-ds-6 text-sm text-text-secondary">Loading settings…</div>}>
      <SettingsV1 activeListingCount={activeListingCount} loadFailed={profile === null} />
    </Suspense>
  );
}
