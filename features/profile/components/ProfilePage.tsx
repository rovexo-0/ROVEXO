import { AccountCenterPage } from "@/features/account-center/components/AccountCenterPage";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type ProfilePageProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

export function ProfilePage({ profile, trustData }: ProfilePageProps) {
  return <AccountCenterPage profile={profile} trustData={trustData} />;
}
