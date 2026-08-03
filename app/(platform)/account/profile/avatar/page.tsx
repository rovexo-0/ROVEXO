import { ProfileAvatarEditor } from "@/features/profile/components/ProfileAvatarEditor";
import { getProfileDetails } from "@/lib/profile/service";
import { getProfile } from "@/lib/profile/data";

export const metadata = {
  title: "Profile Picture | ROVEXO",
  robots: { index: false, follow: false },
};

export default async function AccountProfileAvatarRoute() {
  const profile = await getProfile();
  let avatarUrl: string | null = profile.avatarUrl ?? null;
  let fullName = profile.fullName;
  try {
    const details = await getProfileDetails(profile.id);
    if (details) {
      avatarUrl = details.avatarUrl;
      fullName = details.fullName;
    }
  } catch {
    /* fail-closed: session profile */
  }

  const returnTo = `/user/${encodeURIComponent(profile.username)}`;

  return (
    <ProfileAvatarEditor name={fullName} avatarUrl={avatarUrl} returnTo={returnTo} />
  );
}
