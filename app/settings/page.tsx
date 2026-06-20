import { SettingsPage } from "@/features/settings/components/SettingsPage";
import { fetchProfile } from "@/lib/profile/queries";

export default async function SettingsRoute() {
  const profile = await fetchProfile();

  return <SettingsPage profile={profile} />;
}
