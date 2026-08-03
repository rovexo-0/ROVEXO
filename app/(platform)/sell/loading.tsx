import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SellSkeleton } from "@/components/skeletons/PageSkeletons";

export default function SellLoading() {
  return (
    <BetaAppShell bottomNavTab="sell">
      <SellSkeleton />
    </BetaAppShell>
  );
}
