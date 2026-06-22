import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { fetchProfile } from "@/lib/profile/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function AccountPage() {
  const profile = await fetchProfile();

  return <ProfilePage profile={profile} />;
}
