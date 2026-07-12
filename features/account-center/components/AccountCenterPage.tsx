import "@/styles/rovexo/account-canonical-v2.css";
import { AccountCanonicalShell } from "@/features/account-canonical";
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
    <AccountCanonicalShell title="My Account" hideBack>
      <AccountCenterHome profile={profile} snapshot={snapshot} wallet={wallet} />
    </AccountCanonicalShell>
  );
}
