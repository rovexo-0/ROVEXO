import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { WalletSkeleton } from "@/components/skeletons/PageSkeletons";

export default function WalletLoading() {
  return (
    <BetaAppShell showBottomNav={false}>
      <WalletSkeleton />
    </BetaAppShell>
  );
}
