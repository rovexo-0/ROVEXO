import { NotificationsBellLink } from "@/components/header/NotificationsBellLink";
import { RvxTopBar, RvxTopBarIconLink } from "@/components/header/RvxTopBar";
import { SearchLineIcon } from "@/components/icons/RvxLineIcons";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { AccountCenterHome } from "@/features/account-center/components/AccountCenterHome";
import type { UserProfile } from "@/lib/profile/types";

type AccountCenterPageProps = {
  profile: UserProfile;
  walletBalance?: number | null;
};

export function AccountCenterPage({ profile, walletBalance = null }: AccountCenterPageProps) {
  return (
    <BetaAppShell bottomNavTab="account" className="account-center-shell">
      <RvxTopBar>
        <RvxTopBarIconLink href="/search" label="Search">
          <SearchLineIcon />
        </RvxTopBarIconLink>
        <NotificationsBellLink />
      </RvxTopBar>
      <main className="mx-auto w-full max-w-[640px]">
        <AccountCenterHome profile={profile} walletBalance={walletBalance} />
      </main>
    </BetaAppShell>
  );
}
