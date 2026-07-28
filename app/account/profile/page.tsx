import { ProfileEditPage } from "@/features/account/components/ProfileEditPage";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { getProfileDetails, type ProfileDetails } from "@/lib/profile/service";
import { getProfile } from "@/lib/profile/data";
import type { UserProfile } from "@/lib/profile/types";

export const metadata = {
  title: "Personal Information | ROVEXO",
  robots: { index: false, follow: false },
};

/** Session profile → Personal Information form when detail query is partial/unavailable. */
function profileDetailsFromSession(profile: UserProfile): ProfileDetails {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    fullName: profile.fullName,
    username: profile.username,
    avatarUrl: profile.avatarUrl ?? null,
    phone: null,
    verified: profile.verified,
    bio: null,
    emailVerified: false,
  };
}

export default async function AccountProfileRoute() {
  const profile = await getProfile();

  let details: ProfileDetails | null = null;
  try {
    details = await getProfileDetails(profile.id);
  } catch {
    details = null;
  }

  const initialProfile = details ?? profileDetailsFromSession(profile);

  if (!initialProfile.id || !initialProfile.username) {
    return (
      <MyAccountTemplate
        surface="personal-information"
        title="Personal Information"
        backHref="/account/settings"
        showHeaderTitle
      >
        <FailClosedPanel density="section" homeHref="/" />
      </MyAccountTemplate>
    );
  }

  return <ProfileEditPage initialProfile={initialProfile} phoneVerified={false} />;
}
