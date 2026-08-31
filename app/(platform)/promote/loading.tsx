import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountModuleSkeleton } from "@/components/skeletons/PageSkeletons";

/**
 * P0.4 — Promote matches Balance/Orders reference loading chrome.
 * Without this, soft nav fell through to platform HomeSkeleton.
 */
export default function PromoteLoading() {
  return (
    <AccountCanonicalShell
      title="Promote"
      backHref="/account"
      backLabel="Profile"
      showHeaderTitle
      dataMyAccountSurface="promote"
    >
      <AccountModuleSkeleton />
    </AccountCanonicalShell>
  );
}
