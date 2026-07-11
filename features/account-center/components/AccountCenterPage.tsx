import "@/styles/rovexo/header-v2.css";
import "@/styles/rovexo/account-canonical-v2.css";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { AccountCenterHome } from "@/features/account-center/components/AccountCenterHome";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import type { UserProfile } from "@/lib/profile/types";

import type { WalletData } from "@/lib/wallet/types";

type AccountCenterPageProps = {
  profile: UserProfile;
  snapshot: AccountHubSnapshot;
  wallet?: WalletData | null;
};

export function AccountCenterPage({ profile, snapshot, wallet = null }: AccountCenterPageProps) {
  return (
    <BetaAppShell bottomNavTab="account" className="account-center-shell">
      <RovexoHeaderV2
        layout="account"
        showSearch={false}
        unreadNotifications={profile.unreadNotifications}
      />
      <ScrollContainer withBottomNav className="mx-auto w-full max-w-[640px]">
        <AccountCenterHome profile={profile} snapshot={snapshot} wallet={wallet} />
      </ScrollContainer>
    </BetaAppShell>
  );
}
