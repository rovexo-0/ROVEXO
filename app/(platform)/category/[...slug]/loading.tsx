import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CategorySkeleton } from "@/components/skeletons/PageSkeletons";

export default function CategoryLoading() {
  return (
    <BetaAppShell bottomNavTab="search">
      <CategorySkeleton />
    </BetaAppShell>
  );
}
