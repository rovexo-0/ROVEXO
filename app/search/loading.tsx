import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SearchPageSkeleton } from "@/components/skeletons/PageSkeletons";

export default function SearchLoading() {
  return (
    <BetaAppShell bottomNavTab="search">
      <SearchPageSkeleton />
    </BetaAppShell>
  );
}
