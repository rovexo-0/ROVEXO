import { redirect } from "next/navigation";
import { ProfileEditPage } from "@/features/account/components/ProfileEditPage";
import { getProfileDetails } from "@/lib/profile/service";
import { getProfile } from "@/lib/profile/data";

export const metadata = {
  title: "Edit Profile | ROVEXO",
  robots: { index: false, follow: false },
};

export default async function AccountProfileEditRoute() {
  const profile = await getProfile();
  const details = await getProfileDetails(profile.id);
  if (!details) redirect("/login?next=/account/profile/edit");

  return <ProfileEditPage initialProfile={details} />;
}
