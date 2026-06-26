import { redirect } from "next/navigation";
import { ProfileEditPage } from "@/features/account/components/ProfileEditPage";
import { getProfileDetails } from "@/lib/profile/service";
import { getProfile } from "@/lib/profile/data";

export const metadata = {
  title: "Profile",
};

export default async function AccountProfileRoute() {
  const profile = await getProfile();
  const details = await getProfileDetails(profile.id);
  if (!details) redirect("/login?next=/account/profile");

  return <ProfileEditPage initialProfile={details} isSeller={profile.isSeller} />;
}
