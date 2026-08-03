import { ProfileBioEditor } from "@/features/profile/components/ProfileBioEditor";
import { getProfileDetails } from "@/lib/profile/service";
import { getProfile } from "@/lib/profile/data";

export const metadata = {
  title: "Bio | ROVEXO",
  robots: { index: false, follow: false },
};

export default async function AccountProfileBioRoute() {
  const profile = await getProfile();
  let bio: string | null = null;
  try {
    const details = await getProfileDetails(profile.id);
    bio = details?.bio ?? null;
  } catch {
    bio = null;
  }

  const returnTo = `/user/${encodeURIComponent(profile.username)}`;

  return <ProfileBioEditor initialBio={bio} returnTo={returnTo} />;
}
