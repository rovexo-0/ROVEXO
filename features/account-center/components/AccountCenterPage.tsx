import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { AccountCenterHome } from "@/features/account-center/components/AccountCenterHome";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type AccountCenterPageProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

export function AccountCenterPage({ profile, trustData }: AccountCenterPageProps) {
  return (
    <BetaAppShell bottomNavTab="account" className="account-center-shell">
      <main className="mx-auto w-full max-w-[480px] pb-[calc(84px+env(safe-area-inset-bottom))]">
        <AccountCenterHome profile={profile} trustData={trustData} />
      </main>
    </BetaAppShell>
  );
}
