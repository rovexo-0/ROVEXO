import { AccountFollowersPage } from "@/features/account-center/components/AccountFollowersPage";
import { getBusinessProfile } from "@/lib/profile/data";
import { fetchAccountHubSnapshot } from "@/lib/account-center/snapshot";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

/** Business Followers — stays in Business hub (never dumps to My Account). */
export default async function BusinessFollowersRoute() {
  const profile = await getBusinessProfile();
  const snapshot = await fetchAccountHubSnapshot(profile);

  return (
    <AccountFollowersPage
      profile={profile}
      followerCount={snapshot.followers}
      backHref="/business/dashboard"
    />
  );
}
