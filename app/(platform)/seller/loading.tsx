import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { SellerSkeleton } from "@/components/seller/SellerSkeleton";

export default function SellerLoading() {
  return (
    <BetaAppShell bottomNavTab="sell" className="rovexo-page-home">
      <SellerSkeleton />
    </BetaAppShell>
  );
}
