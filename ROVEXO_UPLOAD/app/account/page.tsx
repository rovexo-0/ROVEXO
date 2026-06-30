import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { fetchProfile } from "@/lib/profile/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";
import { getTrustDashboardData } from "@/lib/trust/service";

export const metadata = privatePageMetadata;

export default async function AccountPage() {
  const profile = await fetchProfile();
  const trustData = await getTrustDashboardData(profile.id, profile.verified);

  return <ProfilePage profile={profile} trustData={trustData} />;
}
