import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ProductSkeleton } from "@/components/skeletons/PageSkeletons";

export default function ListingLoading() {
  return (
    <BetaAppShell bottomNavTab="search">
      <div className="min-h-screen bg-background text-text-primary">
        <ProductSkeleton />
      </div>
    </BetaAppShell>
  );
}
