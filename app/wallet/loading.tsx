import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";

export default function WalletLoading() {
  return (
    <AccountCanonicalShell title="Balance" backHref="/account" backLabel="My Account" showHeaderTitle>
      <AccountModuleSkeleton />
    </AccountCanonicalShell>
  );
}
