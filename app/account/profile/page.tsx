import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProfileViewV1 } from "@/features/account-module/components/ProfileViewV1";
import { getProfileDetails } from "@/lib/profile/service";
import { getProfile } from "@/lib/profile/data";

export const metadata = {
  title: "My Profile | ROVEXO",
  robots: { index: false, follow: false },
};

export default async function AccountProfileRoute() {
  const profile = await getProfile();
  const details = await getProfileDetails(profile.id);
  if (!details) redirect("/login?next=/account/profile");

  return (
    <Suspense>
      <ProfileViewV1 profile={profile} details={details} />
    </Suspense>
  );
}
