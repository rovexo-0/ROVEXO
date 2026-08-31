import { AccountCanonicalShell } from "@/features/account-canonical";
import { SavedSkeleton } from "@/components/skeletons/PageSkeletons";

/**
 * P0.4 — match Balance/Orders reference: Account chrome shell immediately on tap.
 * Previous BetaAppShell chrome mismatched final SavedItemsV1 shell (felt slower).
 */
export default function SavedLoading() {
  return (
    <AccountCanonicalShell title="Saved" backHref="/account" showHeaderTitle>
      <SavedSkeleton />
    </AccountCanonicalShell>
  );
}
