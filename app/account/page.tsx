import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { fetchProfile } from "@/lib/profile/queries";

export default async function AccountPage() {
  const profile = await fetchProfile();

  return <ProfilePage profile={profile} />;
}
