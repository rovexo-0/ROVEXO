import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { PremiumAccountDashboard } from "@/features/account-page/components/PremiumAccountDashboard";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type ProfilePageProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

export function ProfilePage({ profile, trustData }: ProfilePageProps) {
  return (
    <BetaAppShell bottomNavTab="account">
      <main className="mx-auto w-full max-w-2xl pb-[calc(84px+env(safe-area-inset-bottom))]">
        <PremiumAccountDashboard profile={profile} trustData={trustData} />
      </main>
    </BetaAppShell>
  );
}
