import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";
import { AccountCanonicalShell } from "@/features/account-canonical";

export default function AccountSettingsLoading() {
  return (
    <AccountCanonicalShell title="Settings" backHref="/account" showHeaderTitle showBottomNav={false}>
      <AccountModuleSkeleton />
    </AccountCanonicalShell>
  );
}
