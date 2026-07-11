import "@/styles/rovexo/account-canonical-v2.css";
import { AccountFollowersPage } from "@/features/account-center/components/AccountFollowersPage";
import { fetchProfile } from "@/lib/profile/queries";
import { fetchAccountHubSnapshot } from "@/lib/account-center/snapshot";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function AccountFollowersRoute() {
  const profile = await fetchProfile();
  const snapshot = await fetchAccountHubSnapshot(profile);

  return <AccountFollowersPage profile={profile} followerCount={snapshot.followers} />;
}
