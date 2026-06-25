import { redirect } from "next/navigation";
import { ProfileEditPage } from "@/features/account/components/ProfileEditPage";
import { getProfileDetails } from "@/lib/profile/service";
import { getProfile } from "@/lib/profile/data";

export const metadata = {
  title: "Edit Profile",
};

export default async function AccountEditRoute() {
  const profile = await getProfile();
  const details = await getProfileDetails(profile.id);
  if (!details) redirect("/login?next=/account/edit");

  return <ProfileEditPage initialProfile={details} />;
}
